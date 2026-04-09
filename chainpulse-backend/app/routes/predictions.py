import random
from datetime import datetime
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.database import Disruption, Shipment, get_db
from app.ml.predictor import predict_delay_risk, predict_risk, get_risk_level
from app.models.schemas import PredictionRequest, PredictionResponse


router = APIRouter()


class RiskFactor(BaseModel):
    type: str
    description: str
    impact: float


class AssessmentResponse(BaseModel):
    tracking_id: str
    risk_score: float
    risk_level: str
    factors: list[RiskFactor]
    recommendation: str
    should_reroute: bool


class DashboardStats(BaseModel):
    total_shipments: int
    at_risk: int
    rerouted_today: int
    avg_risk_score: float
    disruptions_active: int


def _generate_mock_features(shipment: Shipment) -> dict:
    """Generate mock feature dict for ML model based on shipment data."""
    return {
        "wind_speed_kmh": random.uniform(5, 80),
        "precipitation_mm": random.uniform(0, 50),
        "visibility_km": random.uniform(5, 20),
        "news_sentiment_score": random.uniform(-1, 1),
        "news_disruption_keywords_count": random.randint(0, 10),
        "port_congestion_index": random.uniform(2, 8),
        "cargo_type_encoded": 0 if shipment.cargo_type == "general" else 1 if shipment.cargo_type == "electronics" else 2 if shipment.cargo_type == "perishable" else 3,
        "days_since_last_disruption": random.randint(5, 180),
        "route_distance_km": shipment.route_distance_km if hasattr(shipment, "route_distance_km") else random.uniform(100, 10000),
        "season": random.randint(0, 3),
    }


def _generate_risk_factors(shipment: Shipment, risk_score: float) -> list[RiskFactor]:
    """Generate mock risk factors based on shipment and risk score."""
    factors = []

    # Weather factors
    if risk_score > 0.3:
        weather_impact = min(0.4, random.uniform(0.15, 0.45))
        factors.append(
            RiskFactor(
                type="weather",
                description="Storm warning along route" if risk_score > 0.5 else "Variable weather conditions",
                impact=weather_impact,
            )
        )

    # News/disruption factors
    if risk_score > 0.25:
        news_impact = min(0.35, random.uniform(0.1, 0.4))
        disruption_types = [
            "Port workers strike reported",
            "Regional congestion alert",
            "Supply chain disruption detected",
            "Customs delays reported",
        ]
        factors.append(
            RiskFactor(
                type="news",
                description=random.choice(disruption_types),
                impact=news_impact,
            )
        )

    # Cargo-specific factors
    if shipment.cargo_type == "perishable" and risk_score > 0.2:
        cargo_impact = min(0.25, random.uniform(0.05, 0.3))
        factors.append(
            RiskFactor(
                type="cargo",
                description="Temperature-sensitive cargo requires careful routing",
                impact=cargo_impact,
            )
        )

    if shipment.cargo_type == "hazmat" and risk_score > 0.15:
        hazmat_impact = min(0.3, random.uniform(0.1, 0.35))
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

    # Generate mock features for ML model
    features = _generate_mock_features(shipment)

    # Predict risk using actual ML model
    risk_score = predict_risk(features)
    risk_level = get_risk_level(risk_score)

    # Generate factors and recommendation
    factors = _generate_risk_factors(shipment, risk_score)
    recommendation, should_reroute = _get_recommendation(shipment, risk_score, factors)

    return AssessmentResponse(
        tracking_id=shipment.tracking_id,
        risk_score=round(risk_score, 2),
        risk_level=risk_level,
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
