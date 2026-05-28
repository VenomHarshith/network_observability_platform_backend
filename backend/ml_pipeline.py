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
def run_pipeline(flows):
    # Import models here to avoid circular imports
    from models import FlowWindow, Alert

    # -------------------------
    # Load & preprocess data
    # -------------------------
    df = pd.DataFrame(flows)

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

    if len(X) < 10:
        print("Not enough data for ML yet")
        return
    
    train_X = X.iloc[:-5]
    test_X = X.iloc[-5:]
    
    model.fit(train_X)
    
    features["anomaly_score"] = 0.0

    scores = np.abs(model.decision_function(test_X))
    print("RAW SCORES:", scores)

    features.loc[test_X.index, "anomaly_score"] = scores
    
    # -------------------------
    # Severity classification
    # -------------------------
    features["severity"] = "normal"

    features.loc[
        features["anomaly_score"] > 0.20,
        "severity"
    ] = "high"

    features.loc[
        features["anomaly_score"] > 0.285,
        "severity"
    ] = "critical"

    # -------------------------
    # Store results in DB
    # -------------------------
    print("\n===== ML SCORES =====")
    print(features[[
        "total_bytes",
        "conn_count",
        "avg_fan_out",
        "dst_ip_entropy",
        "anomaly_score",
        "severity"
    ]].tail(10))
    alerts = []

    for ts, row in features.iterrows():

        if row["severity"] != "normal":

            alerts.append({
                "timestamp": str(ts),
                "severity": row["severity"],
                "score": float(row["anomaly_score"]),
                "total_bytes": int(row["total_bytes"]),
                "entropy": float(row["dst_ip_entropy"]),
                "fan_out": float(row["avg_fan_out"])
            })

    return alerts
    