from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


CargoType = Literal["electronics", "perishable", "hazmat", "general"]
ShipmentStatus = Literal["in_transit", "delayed", "delivered", "at_risk"]
DisruptionType = Literal["weather", "news", "traffic", "port_closure"]
SeverityType = Literal["low", "medium", "high", "critical"]


class ShipmentBase(BaseModel):
    owner_email: str
    tracking_id: str
    origin: str
    destination: str
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float
    cargo_type: CargoType
    status: ShipmentStatus
    current_lat: float
    current_lon: float
    risk_score: float = Field(ge=0.0, le=1.0)
    route_distance_km: float = 0.0
    departure_date: datetime
    eta: datetime | None = None


class ShipmentCreate(ShipmentBase):
    tracking_id: str | None = None
    owner_email: str | None = None


class ShipmentUpdate(BaseModel):
    tracking_id: str | None = None
    origin: str | None = None
    destination: str | None = None
    origin_lat: float | None = None
    origin_lon: float | None = None
    dest_lat: float | None = None
    dest_lon: float | None = None
    cargo_type: CargoType | None = None
    status: ShipmentStatus | None = None
    current_lat: float | None = None
    current_lon: float | None = None
    risk_score: float | None = Field(default=None, ge=0.0, le=1.0)
    route_distance_km: float | None = None
    departure_date: datetime | None = None
    eta: datetime | None = None


class ShipmentResponse(ShipmentBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DisruptionBase(BaseModel):
    type: DisruptionType
    severity: SeverityType
    location: str
    lat: float
    lon: float
    description: str
    affected_radius_km: float
    expires_at: datetime


class DisruptionCreate(DisruptionBase):
    pass


class DisruptionUpdate(BaseModel):
    type: DisruptionType | None = None
    severity: SeverityType | None = None
    location: str | None = None
    lat: float | None = None
    lon: float | None = None
    description: str | None = None
    affected_radius_km: float | None = None
    expires_at: datetime | None = None


class DisruptionResponse(DisruptionBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertBase(BaseModel):
    shipment_id: str
    disruption_id: str
    message: str
    is_read: bool = False


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    shipment_id: str | None = None
    disruption_id: str | None = None
    message: str | None = None
    is_read: bool | None = None


class AlertResponse(AlertBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PredictionRequest(BaseModel):
    shipment_id: str


class PredictionResponse(BaseModel):
    shipment_id: str
    delay_risk: float
