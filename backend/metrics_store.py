import csv
import os

CSV_PATH = r"C:\VENOM\Coding\NOP\network-observability\data\metrics_timeseries.csv"

def append_metrics(row):
    file_exists = os.path.exists(CSV_PATH)

    with open(CSV_PATH, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp", "total_bytes", "dst_ip_entropy", "avg_fan_out"])
        writer.writerow([
            row["timestamp"],
            row["total_bytes"],
            row["dst_ip_entropy"],
            row["avg_fan_out"]
        ])


def read_metrics_history(limit=1000):
    if not os.path.exists(CSV_PATH):
        return []

    import pandas as pd
    df = pd.read_csv(CSV_PATH)

    if df.empty:
        return []

    return df.tail(limit).to_dict(orient="records")
