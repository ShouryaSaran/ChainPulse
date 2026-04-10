import joblib
from pathlib import Path


MODEL_DIR = Path(__file__).parent
MODEL_PATH = MODEL_DIR / "model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"

FEATURE_ORDER = [
    "Days for shipment (scheduled)",
    "Order Item Quantity",
    "Product Price",
    "Order Item Discount Rate",
    "Benefit per order",
    "Sales per customer",
    "shipping_mode_numeric",
]

model = None
scaler = None
_artifact_mtime = None


def _load_artifacts(force: bool = False) -> None:
    """Load or reload the model artifacts when the files change."""
    global model, scaler, _artifact_mtime

    try:
        current_mtime = max(MODEL_PATH.stat().st_mtime, SCALER_PATH.stat().st_mtime)
    except FileNotFoundError:
        model = None
        scaler = None
        _artifact_mtime = None
        return

    if not force and _artifact_mtime == current_mtime and model is not None and scaler is not None:
        return

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    _artifact_mtime = current_mtime


_load_artifacts(force=True)


def predict_risk(features: dict) -> float:
    """
    Predict delivery delay risk score from DataCo-style features.
    
    Expected features:
    - Days for shipment (scheduled)
    - Order Item Quantity
    - Product Price
    - Order Item Discount Rate
    - Benefit per order
    - Sales per customer
    - shipping_mode_numeric
    
    Returns risk score 0.0 to 1.0
    """
    _load_artifacts()

    if model is None or scaler is None:
        return 0.0

    feature_values = [features.get(f, 0.0) for f in FEATURE_ORDER]
    feature_values = [feature_values]

    # Scale features
    scaled_features = scaler.transform(feature_values)

    # Predict probability
    risk_score = model.predict_proba(scaled_features)[0][1]
    return float(risk_score)


def get_risk_level(score: float) -> str:
    """
    Convert risk score to human-readable risk level.
    
    Returns: "low", "medium", "high", or "critical"
    """
    if score < 0.25:
        return "low"
    elif score < 0.5:
        return "medium"
    elif score < 0.75:
        return "high"
    else:
        return "critical"


def predict_delay_risk(shipment_id: str) -> float:
    """Legacy function for backward compatibility with routes."""
    _ = shipment_id
    return 0.12
