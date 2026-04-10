from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import socketio
import asyncio
import random
import math
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import inspect, select, text, update

from app.config import settings
from app.routes import alerts, predictions, shipments
from app.routes.shipments import seed_database
from app.database import AsyncSessionLocal, Shipment, Disruption, Base, engine


api_app = FastAPI(
    title="ChainPulse API",
    debug=settings.DEBUG,
)

logger = logging.getLogger(__name__)
_db_warning_shown = False


async def ensure_shipments_columns() -> None:
    async with engine.begin() as conn:
        def _ensure_shipments_schema(sync_conn):
            inspector = inspect(sync_conn)
            if not inspector.has_table("shipments"):
                return

            existing_columns = {column["name"] for column in inspector.get_columns("shipments")}
            if sync_conn.dialect.name == "postgresql":
                if "owner_email" not in existing_columns:
                    sync_conn.execute(
                        text(
                            "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255) NOT NULL DEFAULT 'demo@chainpulse.local'"
                        )
                    )
                if "departure_date" not in existing_columns:
                    sync_conn.execute(
                        text(
                            "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS departure_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"
                        )
                    )
            else:
                if "owner_email" not in existing_columns:
                    sync_conn.execute(
                        text(
                            "ALTER TABLE shipments ADD COLUMN owner_email VARCHAR(255) NOT NULL DEFAULT 'demo@chainpulse.local'"
                        )
                    )
                if "departure_date" not in existing_columns:
                    sync_conn.execute(
                        text(
                            "ALTER TABLE shipments ADD COLUMN departure_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
                        )
                    )

        await conn.run_sync(_ensure_shipments_schema)

# Allow all origins for development and broad client compatibility.
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_app.include_router(shipments.router, prefix="/api/shipments", tags=["shipments"])
api_app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
api_app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])


@api_app.on_event("startup")
async def startup_event():
    """Ensure schema exists, then seed sample data if DB is reachable."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await ensure_shipments_columns()
        await seed_database()
    except Exception:
        logger.warning("Skipping seed on startup because the database is unavailable.")


@api_app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "ChainPulse API"}


sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

# Track previous risk scores for alert detection
previous_risk_scores = {}
last_disruption_time = datetime.now()
simulated_disruption_snapshots: dict[str, list[dict]] = {}


class SimulateDisruptionRequest(BaseModel):
    disruption_type: str
    severity: str
    location: str
    lat: float
    lon: float
    affected_radius_km: float
    duration_hours: int


@sio.event
async def connect(sid, environ, auth):
    print(f"Client {sid} connected")
    return None


@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")
    return None


async def get_in_transit_shipments():
    """Fetch all in-transit shipments from database."""
    global _db_warning_shown
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(Shipment).where(Shipment.status == "in_transit")
            result = await session.execute(stmt)
            _db_warning_shown = False
            return result.scalars().all()
    except Exception:
        if not _db_warning_shown:
            logger.warning("Database unavailable. Live shipment simulation is paused until DB connectivity is restored.")
            _db_warning_shown = True
        return []


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km using Haversine formula."""
    R = 6371  # Earth's radius in km
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


async def emit_shipment_updates():
    """Emit updated shipment positions every 5 seconds."""
    shipments = await get_in_transit_shipments()

    for shipment in shipments:
        # Simulate movement toward destination
        distance = calculate_distance(
            shipment.current_lat, shipment.current_lon,
            shipment.dest_lat, shipment.dest_lon
        )

        if distance > 0.1:  # If not at destination
            # Move 1-2% of remaining distance per update
            move_percentage = random.uniform(0.01, 0.02)
            new_lat = shipment.current_lat + (shipment.dest_lat - shipment.current_lat) * move_percentage
            new_lon = shipment.current_lon + (shipment.dest_lon - shipment.current_lon) * move_percentage

            # Update in database
            async with AsyncSessionLocal() as session:
                stmt = update(Shipment).where(Shipment.id == shipment.id).values(
                    current_lat=new_lat,
                    current_lon=new_lon
                )
                await session.execute(stmt)
                await session.commit()

            # Emit update
            await sio.emit('shipment_update', {
                'id': shipment.id,
                'tracking_id': shipment.tracking_id,
                'current_lat': new_lat,
                'current_lon': new_lon,
                'risk_score': shipment.risk_score,
                'status': shipment.status
            })


async def emit_risk_assessments():
    """Emit recalculated risk scores every 15 seconds."""
    global previous_risk_scores
    shipments = await get_in_transit_shipments()

    for shipment in shipments:
        # Simulate risk score fluctuation (±10%)
        change = random.uniform(-0.1, 0.1)
        new_risk = max(0, min(1, shipment.risk_score + change))

        # Update in database
        async with AsyncSessionLocal() as session:
            stmt = update(Shipment).where(Shipment.id == shipment.id).values(risk_score=new_risk)
            await session.execute(stmt)
            await session.commit()

        # Emit risk assessment
        await sio.emit('risk_assessment', {
            'tracking_id': shipment.tracking_id,
            'risk_score': new_risk,
            'timestamp': datetime.now().isoformat()
        })

        # Check for risk threshold crossing (0.7)
        old_score = previous_risk_scores.get(shipment.id, shipment.risk_score)
        if old_score <= 0.7 < new_risk:
            await sio.emit('alert', {
                'type': 'high_risk',
                'tracking_id': shipment.tracking_id,
                'risk_score': new_risk,
                'message': f'Risk score exceeded 0.7 threshold for {shipment.tracking_id}',
                'timestamp': datetime.now().isoformat()
            })

        previous_risk_scores[shipment.id] = new_risk


async def emit_random_disruptions():
    """Emit random disruptions every 30 seconds."""
    global last_disruption_time
    try:
        # 30% chance of emitting a disruption
        if random.random() < 0.3:
            disruption_types = [
                {'type': 'weather', 'severity': random.choice(['low', 'medium', 'high'])},
                {'type': 'port_closure', 'severity': random.choice(['low', 'medium'])},
                {'type': 'flood', 'severity': random.choice(['medium', 'high'])},
                {'type': 'technical_issue', 'severity': 'low'},
            ]
            
            disruption_data = random.choice(disruption_types)
            
            # Random location (major shipping routes)
            locations = [
                {'name': 'Singapore Strait', 'lat': 1.35, 'lon': 103.82},
                {'name': 'Suez Canal', 'lat': 29.97, 'lon': 31.13},
                {'name': 'Panama Canal', 'lat': 9.09, 'lon': -79.52},
                {'name': 'Port of Rotterdam', 'lat': 51.92, 'lon': 4.48},
                {'name': 'Hong Kong', 'lat': 22.32, 'lon': 114.17},
            ]
            
            location = random.choice(locations)
            
            # Create disruption in database
            from app.database import Disruption as DisruptionModel
            
            async with AsyncSessionLocal() as session:
                new_disruption = DisruptionModel(
                    disruption_type=disruption_data['type'],
                    severity=disruption_data['severity'],
                    location=location['name'],
                    lat=location['lat'],
                    lon=location['lon'],
                    affected_radius_km=random.uniform(50, 300),
                    description=f"New {disruption_data['type'].replace('_', ' ')} in {location['name']}",
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
                )
                session.add(new_disruption)
                await session.commit()
                
                # Emit to clients
                await sio.emit('new_disruption', {
                    'id': new_disruption.id,
                    'type': new_disruption.disruption_type,
                    'severity': new_disruption.severity,
                    'location': new_disruption.location,
                    'lat': new_disruption.lat,
                    'lon': new_disruption.lon,
                    'affected_radius_km': new_disruption.affected_radius_km,
                    'description': new_disruption.description,
                    'created_at': new_disruption.created_at.isoformat(),
                    'expires_at': new_disruption.expires_at.isoformat()
                })
                
                last_disruption_time = datetime.now()
    except Exception as e:
        print(f"Error emitting disruptions: {e}")


def _severity_to_risk_boost(severity: str) -> float:
    mapping = {
        "low": 0.08,
        "medium": 0.18,
        "high": 0.32,
        "critical": 0.48,
    }
    return mapping.get(severity, 0.18)


@api_app.post("/api/disruptions/simulate")
async def simulate_disruption(payload: SimulateDisruptionRequest):
    """Simulate a disruption and update affected shipments immediately."""
    expires_at = datetime.now(timezone.utc) + timedelta(hours=payload.duration_hours)

    async with AsyncSessionLocal() as session:
        disruption = Disruption(
            disruption_type=payload.disruption_type,
            severity=payload.severity,
            location=payload.location,
            lat=payload.lat,
            lon=payload.lon,
            affected_radius_km=payload.affected_radius_km,
            description=f"Simulated {payload.disruption_type.replace('_', ' ')} at {payload.location}",
            expires_at=expires_at,
        )
        session.add(disruption)
        await session.flush()
        await session.refresh(disruption)

        stmt = select(Shipment).where(Shipment.status == "in_transit")
        result = await session.execute(stmt)
        shipments = result.scalars().all()

        affected_shipments = []
        boost = _severity_to_risk_boost(payload.severity)
        snapshots: list[dict] = []

        for shipment in shipments:
            previous_score = shipment.risk_score
            distance = calculate_distance(payload.lat, payload.lon, shipment.current_lat, shipment.current_lon)
            if distance <= payload.affected_radius_km:
                snapshots.append(
                    {
                        "id": shipment.id,
                        "risk_score": previous_score,
                        "status": shipment.status,
                    }
                )
                proximity_factor = max(0.25, 1 - (distance / max(payload.affected_radius_km, 1)))
                new_risk = min(1.0, previous_score + boost * proximity_factor)
                new_status = "at_risk" if new_risk >= 0.7 else shipment.status

                shipment.risk_score = new_risk
                shipment.status = new_status
                affected_shipments.append({
                    "id": shipment.id,
                    "tracking_id": shipment.tracking_id,
                    "current_lat": shipment.current_lat,
                    "current_lon": shipment.current_lon,
                    "risk_score": new_risk,
                    "status": new_status,
                })

                await sio.emit(
                    "shipment_update",
                    {
                        "id": shipment.id,
                        "tracking_id": shipment.tracking_id,
                        "current_lat": shipment.current_lat,
                        "current_lon": shipment.current_lon,
                        "risk_score": new_risk,
                        "status": new_status,
                    },
                )

                await sio.emit(
                    "risk_assessment",
                    {
                        "tracking_id": shipment.tracking_id,
                        "risk_score": new_risk,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )

                if previous_score < 0.7 <= new_risk:
                    await sio.emit(
                        "alert",
                        {
                            "type": "high_risk",
                            "tracking_id": shipment.tracking_id,
                            "risk_score": new_risk,
                            "message": f"{shipment.tracking_id} risk crossed the 0.7 threshold",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        },
                    )

        await session.commit()

        simulated_disruption_snapshots[disruption.id] = snapshots

        disruption_payload = {
            "id": disruption.id,
            "type": disruption.disruption_type,
            "severity": disruption.severity,
            "location": disruption.location,
            "lat": disruption.lat,
            "lon": disruption.lon,
            "affected_radius_km": disruption.affected_radius_km,
            "description": disruption.description,
            "created_at": disruption.created_at.isoformat() if disruption.created_at else datetime.now(timezone.utc).isoformat(),
            "expires_at": disruption.expires_at.isoformat(),
        }

    await sio.emit("new_disruption", disruption_payload)

    return {
        "message": f"Disruption triggered! {len(affected_shipments)} shipments affected",
        "affected_shipments": affected_shipments,
        "disruption": disruption_payload,
    }


@api_app.post("/api/disruptions/{disruption_id}/cancel")
async def cancel_simulated_disruption(disruption_id: str):
    """Cancel a simulated disruption, restore affected shipments, and remove disruption zone."""
    snapshots = simulated_disruption_snapshots.get(disruption_id, [])

    async with AsyncSessionLocal() as session:
        disruption_result = await session.execute(select(Disruption).where(Disruption.id == disruption_id))
        disruption = disruption_result.scalar_one_or_none()
        if not disruption:
            raise HTTPException(status_code=404, detail="Disruption not found")

        restored_shipments = []
        for snapshot in snapshots:
            shipment_result = await session.execute(select(Shipment).where(Shipment.id == snapshot["id"]))
            shipment = shipment_result.scalar_one_or_none()
            if not shipment:
                continue

            shipment.risk_score = snapshot["risk_score"]
            shipment.status = snapshot["status"]

            restored_payload = {
                "id": shipment.id,
                "tracking_id": shipment.tracking_id,
                "current_lat": shipment.current_lat,
                "current_lon": shipment.current_lon,
                "risk_score": shipment.risk_score,
                "status": shipment.status,
            }
            restored_shipments.append(restored_payload)

        await session.delete(disruption)
        await session.commit()

    simulated_disruption_snapshots.pop(disruption_id, None)

    for shipment_payload in restored_shipments:
        await sio.emit("shipment_update", shipment_payload)
        await sio.emit(
            "risk_assessment",
            {
                "tracking_id": shipment_payload["tracking_id"],
                "risk_score": shipment_payload["risk_score"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

    await sio.emit("disruption_cleared", {"id": disruption_id})

    return {
        "message": f"Disruption {disruption_id} cancelled and system restored",
        "restored_shipments": restored_shipments,
        "cleared_disruption_id": disruption_id,
    }


async def background_tasks():
    """Run background tasks for socket.io events."""
    # Wait for app to fully start
    await asyncio.sleep(2)
    
    task_5s = None
    task_15s = None
    task_30s = None
    
    try:
        while True:
            # Every 5 seconds: emit shipment updates
            if task_5s is None or task_5s.done():
                task_5s = asyncio.create_task(emit_shipment_updates())
            
            # Every 15 seconds: emit risk assessments (runs 3 times per 5s cycle)
            if task_15s is None or task_15s.done():
                task_15s = asyncio.create_task(emit_risk_assessments())
            
            # Every 30 seconds: emit random disruptions (runs 6 times per 5s cycle)
            if task_30s is None or task_30s.done():
                task_30s = asyncio.create_task(emit_random_disruptions())
            
            await asyncio.sleep(5)
    except Exception as e:
        print(f"Background tasks error: {e}")


@api_app.on_event("startup")
async def start_background_tasks():
    """Start background tasks on app startup."""
    asyncio.create_task(background_tasks())


# ASGI entrypoint that serves both FastAPI routes and Socket.IO.
app = socketio.ASGIApp(sio, other_asgi_app=api_app)

# Ensure CORS headers are added at the actual served ASGI entrypoint.
app = CORSMiddleware(
    app,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
