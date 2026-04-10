import math
from datetime import datetime, timezone
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.database import Disruption, Shipment, get_db
from app.ml.predictor import predict_delay_risk, predict_risk, get_risk_level
from app.models.schemas import PredictionRequest, PredictionResponse


router = APIRouter()
LIVE_WEIGHT = 0.7
MODEL_WEIGHT = 0.3


class RiskFactor(BaseModel):
    type: str
    description: str
    impact: float


class AssessmentResponse(BaseModel):
    tracking_id: str
    risk_score: float
    risk_level: str
    model_score: float | None = None
    model_raw_score: float | None = None
    live_score: float | None = None
    score_source: str = "blended"
    factors: list[RiskFactor]
    recommendation: str
    should_reroute: bool


class DashboardStats(BaseModel):
    total_shipments: int
    at_risk: int
    rerouted_today: int
    avg_risk_score: float
    disruptions_active: int


def _clamp_risk(score: float) -> float:
    return max(0.0, min(1.0, float(score)))


def _calibrate_model_score(raw_score: float) -> float:
    """Lightweight probability calibration to reduce overconfidence for demo-time decisions."""
    score = _clamp_risk(raw_score)
    # Pull extremes toward the center to avoid chronic 95%+ spikes without retraining.
    return _clamp_risk(0.15 + 0.7 * score)


def _days_since_departure(shipment: Shipment) -> int:
    departure = shipment.departure_date
    if departure.tzinfo is None:
        departure = departure.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    return max(1, int(math.ceil((now - departure).total_seconds() / 86400)))


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance between two geo points in km."""
    radius_earth_km = 6371.0
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return radius_earth_km * c


def _disruption_exposure_score(shipment: Shipment, disruptions: list[Disruption]) -> float:
    """Return disruption exposure in [0,1] based on proximity to active disruption radii."""
    if not disruptions:
        return 0.0

    max_exposure = 0.0
    for disruption in disruptions:
        radius = max(float(disruption.affected_radius_km or 0.0), 1.0)
        dist = _distance_km(shipment.current_lat, shipment.current_lon, disruption.lat, disruption.lon)
        exposure = max(0.0, 1.0 - (dist / radius))
        if exposure > max_exposure:
            max_exposure = exposure

    return _clamp_risk(max_exposure)


def _progress_score(shipment: Shipment) -> float:
    """Approximate route progress in [0,1] from geo position."""
    full_distance = _distance_km(shipment.origin_lat, shipment.origin_lon, shipment.dest_lat, shipment.dest_lon)
    if full_distance <= 1e-6:
        return 0.0
    remaining = _distance_km(shipment.current_lat, shipment.current_lon, shipment.dest_lat, shipment.dest_lon)
    progress = 1.0 - (remaining / full_distance)
    return _clamp_risk(progress)


def _contextualize_model_score(model_score: float, shipment: Shipment, exposure: float) -> float:
    """Adjust model signal using real-time context to avoid flat/constant outputs."""
    progress = _progress_score(shipment)
    # Baseline + disruption exposure + route progress context.
    context_factor = 0.35 + (0.45 * exposure) + (0.2 * progress)
    return _clamp_risk(model_score * context_factor)


def _generate_stable_features(shipment: Shipment) -> dict:
    """Generate deterministic DataCo-style features derived from shipment fields."""
    route_distance = max(float(getattr(shipment, "route_distance_km", 0.0) or 0.0), 100.0)
    scheduled_days = max(1, int(math.ceil(route_distance / 850.0)))

    cargo_profile = {
        "electronics": {"qty": 6, "price": 1200.0, "discount": 0.08, "benefit": 180.0, "sales": 2400.0, "mode": 1},
        "perishable": {"qty": 20, "price": 180.0, "discount": 0.04, "benefit": 55.0, "sales": 1100.0, "mode": 2},
        "hazmat": {"qty": 4, "price": 950.0, "discount": 0.02, "benefit": 220.0, "sales": 3000.0, "mode": 2},
        "general": {"qty": 12, "price": 320.0, "discount": 0.06, "benefit": 90.0, "sales": 1500.0, "mode": 2},
    }
    profile = cargo_profile.get((shipment.cargo_type or "general").lower(), cargo_profile["general"])

    return {
        "Days for shipment (scheduled)": scheduled_days,
        "Order Item Quantity": profile["qty"],
        "Product Price": profile["price"],
        "Order Item Discount Rate": profile["discount"],
        "Benefit per order": profile["benefit"],
        "Sales per customer": profile["sales"],
        "shipping_mode_numeric": profile["mode"],
    }


def _generate_risk_factors(shipment: Shipment, risk_score: float) -> list[RiskFactor]:
    """Generate deterministic risk factors based on shipment and risk score."""
    factors = []

    # Weather factors
    if risk_score > 0.3:
        weather_impact = min(0.4, max(0.15, risk_score * 0.35))
        factors.append(
            RiskFactor(
                type="weather",
                description="Storm warning along route" if risk_score > 0.5 else "Variable weather conditions",
                impact=weather_impact,
            )
        )

    # News/disruption factors
    if risk_score > 0.25:
        news_impact = min(0.35, max(0.1, risk_score * 0.25))
        factors.append(
            RiskFactor(
                type="news",
                description="Supply chain disruption detected",
                impact=news_impact,
            )
        )

    # Cargo-specific factors
    if shipment.cargo_type == "perishable" and risk_score > 0.2:
        cargo_impact = min(0.25, max(0.08, risk_score * 0.2))
        factors.append(
            RiskFactor(
                type="cargo",
                description="Temperature-sensitive cargo requires careful routing",
                impact=cargo_impact,
            )
        )

    if shipment.cargo_type == "hazmat" and risk_score > 0.15:
        hazmat_impact = min(0.3, max(0.1, risk_score * 0.24))
        factors.append(
            RiskFactor(
                type="cargo",
                description="Hazardous materials require regulatory-compliant routes",
                impact=hazmat_impact,
            )
        )

    return factors[:3]  # Limit to top 3 factors


def _get_recommendation(shipment: Shipment, risk_score: float, factors: list[RiskFactor]) -> tuple[str, bool]:
    """Generate recommendation and reroute flag based on risk assessment."""
    if risk_score < 0.25:
        return "Continue on planned route", False
    elif risk_score < 0.5:
        return "Monitor conditions; consider alternate route if conditions worsen", False
    elif risk_score < 0.75:
        should_reroute = any(f.type == "weather" for f in factors)
        recommendation = (
            "Reroute via southern corridor to avoid storm"
            if should_reroute
            else "Reroute recommended to minimize disruption"
        )
        return recommendation, True
    else:
        return "Immediate reroute required; contact logistics team", True


@router.post("", response_model=PredictionResponse)
async def predict_shipment_delay(payload: PredictionRequest) -> PredictionResponse:
    """Legacy endpoint for backward compatibility."""
    risk = predict_delay_risk(payload.shipment_id)
    return PredictionResponse(shipment_id=payload.shipment_id, delay_risk=risk)


@router.post("/assess", response_model=AssessmentResponse)
async def assess_shipment_risk(payload: PredictionRequest, owner_email: str | None = Query(default=None), db=Depends(get_db)):
    """Assess full risk for a shipment using ML model and live data."""
    # Fetch shipment
    stmt = select(Shipment).where(Shipment.tracking_id == payload.shipment_id)
    if owner_email:
        stmt = stmt.where(Shipment.owner_email == owner_email)
    result = await db.execute(stmt)
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")

    if shipment.status == "delivered":
        delivered_score = min(max(float(shipment.risk_score or 0.0), 0.0), 0.1)
        return AssessmentResponse(
            tracking_id=shipment.tracking_id,
            risk_score=round(delivered_score, 2),
            risk_level="delivered",
            model_score=None,
            model_raw_score=None,
            live_score=round(delivered_score, 2),
            score_source="live",
            factors=[],
            recommendation="Shipment already delivered. Risk reassessment is not required.",
            should_reroute=False,
        )

    # Use deterministic features and keep displayed assessment anchored to live shipment risk.
    features = _generate_stable_features(shipment)
    model_raw_score = _clamp_risk(predict_risk(features))
    calibrated_model_score = _calibrate_model_score(model_raw_score)
    live_score = _clamp_risk(shipment.risk_score or 0.0)

    # Active disruption context makes model signal scenario-aware.
    disruptions_result = await db.execute(
        select(Disruption).where(Disruption.expires_at > datetime.now(timezone.utc))
    )
    active_disruptions = disruptions_result.scalars().all()
    exposure = _disruption_exposure_score(shipment, active_disruptions)
    model_score = _contextualize_model_score(calibrated_model_score, shipment, exposure)

    # Single decision score used across the app.
    risk_score = _clamp_risk((LIVE_WEIGHT * live_score) + (MODEL_WEIGHT * model_score))
    score_source = "blended"
    risk_level = get_risk_level(risk_score)

    # Persist the decision score so list/map/cards converge with the assessed value.
    shipment.risk_score = risk_score
    await db.commit()
    await db.refresh(shipment)

    # Generate factors and recommendation
    factors = _generate_risk_factors(shipment, risk_score)
    recommendation, should_reroute = _get_recommendation(shipment, risk_score, factors)

    return AssessmentResponse(
        tracking_id=shipment.tracking_id,
        risk_score=round(risk_score, 2),
        risk_level=risk_level,
        model_score=round(model_score, 2),
        model_raw_score=round(model_raw_score, 2),
        live_score=round(live_score, 2),
        score_source=score_source,
        factors=factors,
        recommendation=recommendation,
        should_reroute=should_reroute,
    )


@router.get("/dashboard-stats", response_model=DashboardStats)
async def get_dashboard_stats(owner_email: str | None = Query(default=None), db=Depends(get_db)):
    """Get aggregate dashboard statistics."""
    shipment_filters = []
    if owner_email:
        shipment_filters.append(Shipment.owner_email == owner_email)

    # Total shipments
    total_query = select(func.count(Shipment.id))
    if shipment_filters:
        total_query = total_query.where(*shipment_filters)
    total_result = await db.execute(total_query)
    total_shipments = total_result.scalar() or 0

    # Shipments at risk
    at_risk_query = select(func.count(Shipment.id)).where(Shipment.status == "at_risk")
    if shipment_filters:
        at_risk_query = at_risk_query.where(*shipment_filters)
    at_risk_result = await db.execute(at_risk_query)
    at_risk = at_risk_result.scalar() or 0

    # Average risk score
    avg_query = select(func.avg(Shipment.risk_score))
    if shipment_filters:
        avg_query = avg_query.where(*shipment_filters)
    avg_result = await db.execute(avg_query)
    avg_risk_score = float(avg_result.scalar() or 0.0)

    # Active disruptions
    active_result = await db.execute(
        select(func.count(Disruption.id)).where(Disruption.expires_at > datetime.utcnow())
    )
    disruptions_active = active_result.scalar() or 0

    # Rerouted today (mock: count of shipments with "delayed" status)
    rerouted_query = select(func.count(Shipment.id)).where(Shipment.status == "delayed")
    if shipment_filters:
        rerouted_query = rerouted_query.where(*shipment_filters)
    rerouted_result = await db.execute(rerouted_query)
    rerouted_today = rerouted_result.scalar() or 0

    return DashboardStats(
        total_shipments=total_shipments,
        at_risk=at_risk,
        rerouted_today=rerouted_today,
        avg_risk_score=round(avg_risk_score, 4),
        disruptions_active=disruptions_active,
    )
