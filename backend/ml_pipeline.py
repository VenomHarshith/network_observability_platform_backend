import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

# -------------------------
# Helper: entropy
# -------------------------
def entropy(series):
    probs = series.value_counts(normalize=True)
    return -np.sum(probs * np.log2(probs + 1e-9))

# -------------------------
# MAIN PIPELINE FUNCTION
# -------------------------
def run_pipeline(db, csv_path="flows.csv"):
    # Import models here to avoid circular imports
    from models import FlowWindow, Alert

    # -------------------------
    # Load & preprocess data
    # -------------------------
    df = pd.read_csv(csv_path)

    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")
    df["time_window"] = df["timestamp"].dt.floor("5s")  # fixed warning

    # -------------------------
    # Feature extraction
    # -------------------------
    traffic = df.groupby("time_window")["bytes"].sum()
    conn_count = df.groupby("time_window").size()

    fan_out = (
        df.groupby(["time_window", "src_ip"])["dst_ip"]
          .nunique()
          .groupby("time_window")
          .mean()
    )

    dst_entropy = (
        df.groupby("time_window")["dst_ip"]
          .apply(entropy)
    )

    features = pd.concat(
        [traffic, conn_count, fan_out, dst_entropy],
        axis=1
    ).fillna(0)

    features.columns = [
        "total_bytes",
        "conn_count",
        "avg_fan_out",
        "dst_ip_entropy"
    ]

    # -------------------------
    # ML (IMPORTANT FIX)
    # -------------------------
    X = features[[
        "total_bytes",
        "conn_count",
        "avg_fan_out",
        "dst_ip_entropy"
    ]]

    model = IsolationForest(
        n_estimators=200,
        contamination=0.03,
        random_state=42
    )

    model.fit(X)
    features["anomaly_score"] = model.decision_function(X)

    # -------------------------
    # Severity classification
    # -------------------------
    features["severity"] = "normal"
    features.loc[features["anomaly_score"] < -0.3, "severity"] = "high"
    features.loc[features["anomaly_score"] < -0.5, "severity"] = "critical"

    # -------------------------
    # Store results in DB
    # -------------------------
    for ts, row in features.iterrows():
        db.merge(
            FlowWindow(
                timestamp=ts,
                total_bytes=row["total_bytes"],
                conn_count=row["conn_count"],
                avg_fan_out=row["avg_fan_out"],
                dst_ip_entropy=row["dst_ip_entropy"],
                anomaly_score=row["anomaly_score"],
                severity=row["severity"],
            )
        )

        if row["severity"] in ["high", "critical"]:
            db.add(
                Alert(
                    timestamp=ts,
                    severity=row["severity"],
                    reason=(
                        f"entropy={row['dst_ip_entropy']:.2f}, "
                        f"fanout={row['avg_fan_out']:.1f}"
                    )
                )
            )

    db.commit()
