from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, Uuid, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.config import settings


def _normalize_async_database_url(database_url: str) -> str:
	if database_url.startswith("postgresql://"):
		database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
	elif database_url.startswith("postgres://"):
		database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

	if not database_url.startswith("postgresql+asyncpg://"):
		return database_url

	parsed = urlparse(database_url)
	query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
	normalized_pairs: list[tuple[str, str]] = []

	for key, value in query_pairs:
		# asyncpg expects `ssl`, while many managed Postgres URLs use `sslmode`.
		if key == "sslmode":
			normalized_pairs.append(("ssl", value))
		else:
			normalized_pairs.append((key, value))

	normalized_query = urlencode(normalized_pairs)
	return urlunparse(parsed._replace(query=normalized_query))


DATABASE_URL = _normalize_async_database_url(settings.DATABASE_URL)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
	pass


class Shipment(Base):
	__tablename__ = "shipments"

	id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
	owner_email: Mapped[str] = mapped_column(String(255), index=True, nullable=False, default="demo@chainpulse.local")
	tracking_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
	origin: Mapped[str] = mapped_column(String(120), nullable=False)
	destination: Mapped[str] = mapped_column(String(120), nullable=False)
	origin_lat: Mapped[float] = mapped_column(Float, nullable=False)
	origin_lon: Mapped[float] = mapped_column(Float, nullable=False)
	dest_lat: Mapped[float] = mapped_column(Float, nullable=False)
	dest_lon: Mapped[float] = mapped_column(Float, nullable=False)
	cargo_type: Mapped[str] = mapped_column(String(20), nullable=False)
	status: Mapped[str] = mapped_column(String(20), nullable=False)
	current_lat: Mapped[float] = mapped_column(Float, nullable=False)
	current_lon: Mapped[float] = mapped_column(Float, nullable=False)
	risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
	route_distance_km: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
	departure_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
	eta: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

	alerts: Mapped[list["Alert"]] = relationship(back_populates="shipment")


class Disruption(Base):
	__tablename__ = "disruptions"

	id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
	disruption_type: Mapped[str] = mapped_column(String(50), nullable=False)
	severity: Mapped[str] = mapped_column(String(20), nullable=False)
	location: Mapped[str] = mapped_column(String(120), nullable=False)
	lat: Mapped[float] = mapped_column(Float, nullable=False)
	lon: Mapped[float] = mapped_column(Float, nullable=False)
	affected_radius_km: Mapped[float] = mapped_column(Float, nullable=False)
	description: Mapped[str] = mapped_column(Text, nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

	alerts: Mapped[list["Alert"]] = relationship(back_populates="disruption")


class Alert(Base):
	__tablename__ = "alerts"

	id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
	shipment_id: Mapped[str] = mapped_column(ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False, index=True)
	disruption_id: Mapped[str] = mapped_column(ForeignKey("disruptions.id", ondelete="CASCADE"), nullable=False, index=True)
	message: Mapped[str] = mapped_column(Text, nullable=False)
	is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

	shipment: Mapped[Shipment] = relationship(back_populates="alerts")
	disruption: Mapped[Disruption] = relationship(back_populates="alerts")


async def get_db() -> AsyncSession:
	async with AsyncSessionLocal() as session:
		yield session
