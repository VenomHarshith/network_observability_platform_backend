import math
import time
import pandas as pd

def shannon_entropy(series):
    counts = series.value_counts()
    total = counts.sum()

    if total == 0:
        return 0.0

    entropy = 0.0
    for c in counts:
        p = c / total
        entropy -= p * math.log2(p)

    return round(entropy, 3)


def compute_metrics(df: pd.DataFrame):
    if df is None or df.empty:
        return []

    try:
        df = df.copy()

        # Ensure numeric types
        df["bytes"] = pd.to_numeric(df["bytes"], errors="coerce").fillna(0)
        df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce").fillna(0)

        
        timestamp = int(time.time() * 1000)


        total_bytes = int(df["bytes"].sum())

        # throughput over 5 second window (MB/s)
        throughput_mbps = float(round((total_bytes / 5) / (1024 * 1024), 3))

        entropy = shannon_entropy(df["dst_ip"])

        fanout = (
            df.groupby("src_ip")["dst_ip"]
            .nunique()
            .mean()
        )

        if pd.isna(fanout):
            fanout = 0.0

        return [{
            "timestamp": timestamp,
            "total_bytes": total_bytes,
            "throughput_mbps": throughput_mbps,
            "dst_ip_entropy": float(entropy),
            "avg_fan_out": float(round(fanout, 2))
        }]

    except Exception as e:
        print("METRICS COMPUTE ERROR:", e)
        return []
