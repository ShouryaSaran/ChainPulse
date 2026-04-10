import numpy as np
import pandas as pd
from pathlib import Path
import json

import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, fbeta_score
import xgboost as xgb


MODEL_DIR = Path(__file__).parent
MODEL_PATH = MODEL_DIR / "model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"
DATA_PATH = MODEL_DIR / "DataCoSupplyChainDataset.csv"
THRESHOLD_PATH = MODEL_DIR / "threshold.json"

POSITIVE_CLASS_WEIGHT = 1.6

def _load_and_prepare_data() -> tuple[pd.DataFrame, np.ndarray]:
    """Load DataCo dataset and prepare features for training."""
    print(f"[ML Pipeline] Loading DataCo dataset from {DATA_PATH}...")

    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    for encoding in ["utf-8", "latin-1", "iso-8859-1", "cp1252"]:
        try:
            df = pd.read_csv(DATA_PATH, encoding=encoding)
            print(f"[ML Pipeline] Successfully read CSV with {encoding} encoding")
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError("Could not read CSV with any standard encoding")

    print(f"[ML Pipeline] Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")

    feature_cols = [
        "Days for shipment (scheduled)",
        "Order Item Quantity",
        "Product Price",
        "Order Item Discount Rate",
        "Benefit per order",
        "Sales per customer",
    ]

    if "Shipping Mode" in df.columns:
        shipping_map = {"Ship": 0, "Flight": 1, "Road": 2}
        df["shipping_mode_numeric"] = df["Shipping Mode"].map(shipping_map).fillna(2).astype(int)
        feature_cols.append("shipping_mode_numeric")

    X = df[feature_cols].fillna(0).astype(np.float32)

    if "Late_delivery_risk" not in df.columns:
        raise ValueError("Target column 'Late_delivery_risk' not found in dataset")

    y = df["Late_delivery_risk"].values.astype(np.int32)

    print(f"[ML Pipeline] Using {X.shape[1]} features: {list(X.columns)}")
    print(f"[ML Pipeline] Feature matrix shape: {X.shape}")
    print(f"[ML Pipeline] Target distribution - No Risk: {(y == 0).sum()}, At Risk: {(y == 1).sum()}")

    return X, y


def train_model() -> str:
    """Train XGBoost model on DataCo dataset and save to disk."""
    print("[ML Pipeline] Starting training on DataCo dataset...")
    X, y = _load_and_prepare_data()
    print(f"[ML Pipeline] Dataset shape: {X.shape}")
    print(f"[ML Pipeline] Positive samples: {y.sum()} ({y.sum() / len(y) * 100:.1f}%)")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scale features
    print("[ML Pipeline] Fitting scaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train XGBoost classifier
    print("[ML Pipeline] Training XGBoost classifier...")
    model = xgb.XGBClassifier(
        n_estimators=220,
        max_depth=5,
        learning_rate=0.06,
        subsample=0.9,
        colsample_bytree=0.9,
        scale_pos_weight=POSITIVE_CLASS_WEIGHT,
        random_state=42,
        eval_metric='logloss',
    )
    model.fit(
        X_train_scaled,
        y_train,
        eval_set=[(X_test_scaled, y_test)],
        verbose=False,
    )

    # Evaluate at default threshold
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    y_pred_default = (y_prob >= 0.5).astype(np.int32)
    print("\n[ML Pipeline] Classification Report (threshold=0.50):")
    print(classification_report(y_test, y_pred_default, target_names=["No Risk", "At Risk"]))

    print("\n[ML Pipeline] Confusion Matrix (threshold=0.50):")
    print(confusion_matrix(y_test, y_pred_default))

    # Tune threshold for better recall-sensitive balance (F2 score)
    candidate_thresholds = np.linspace(0.2, 0.8, 61)
    best_threshold = 0.5
    best_f2 = -1.0
    for threshold in candidate_thresholds:
        y_pred = (y_prob >= threshold).astype(np.int32)
        f2 = fbeta_score(y_test, y_pred, beta=2, zero_division=0)
        if f2 > best_f2:
            best_f2 = f2
            best_threshold = float(threshold)

    y_pred_tuned = (y_prob >= best_threshold).astype(np.int32)
    print(f"\n[ML Pipeline] Tuned threshold (F2-opt): {best_threshold:.2f}")
    print("[ML Pipeline] Classification Report (tuned threshold):")
    print(classification_report(y_test, y_pred_tuned, target_names=["No Risk", "At Risk"]))

    print("\n[ML Pipeline] Confusion Matrix (tuned threshold):")
    print(confusion_matrix(y_test, y_pred_tuned))

    # Feature importances
    feature_importance = pd.DataFrame(
        {"feature": X.columns, "importance": model.feature_importances_}
    ).sort_values("importance", ascending=False)
    print("\n[ML Pipeline] Top Feature Importances:")
    print(feature_importance.head(10).to_string(index=False))

    # Save model and scaler
    print(f"\n[ML Pipeline] Saving model to {MODEL_PATH}")
    joblib.dump(model, MODEL_PATH)
    print(f"[ML Pipeline] Saving scaler to {SCALER_PATH}")
    joblib.dump(scaler, SCALER_PATH)
    print(f"[ML Pipeline] Saving tuned threshold to {THRESHOLD_PATH}")
    THRESHOLD_PATH.write_text(json.dumps({"threshold": round(best_threshold, 4)}, indent=2), encoding="utf-8")

    return "Model training completed successfully on DataCo dataset"
