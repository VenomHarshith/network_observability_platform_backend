import pandas as pd
import numpy as np
import time
import os

WINDOW_SIZE = 5
CSV_FILE = r"C:\VENOM\Coding\NOP\network-observability\backend\live_flows.csv"

def entropy(series):
    probs = series.value_counts(normalize=True)
    return -np.sum(probs * np.log2(probs + 1e-9))

def run():
    print("Starting real-time stream processor...")

    while True:
        if not os.path.exists(CSV_FILE):
            time.sleep(1)
            continue

        try:
            df = pd.read_csv(CSV_FILE)
        except:
            time.sleep(1)
            continue

        if df.empty or len(df.columns) < 4:
            time.sleep(1)
            continue

        df.columns = ["timestamp", "src_ip", "dst_ip", "bytes"]
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")

        now = pd.Timestamp.now()
        df = df[df["timestamp"] >= now - pd.Timedelta(seconds=WINDOW_SIZE)]

        if df.empty:
            time.sleep(1)
            continue

        traffic = int(df["bytes"].sum())
        conn_count = int(len(df))
        fan_out = round(df.groupby("src_ip")["dst_ip"].nunique().mean(), 2)
        dst_entropy = round(entropy(df["dst_ip"]), 3)

        print("\n[STREAM FEATURES]")
        print("timestamp:", now)
        print("total_bytes:", traffic)
        print("conn_count:", conn_count)
        print("avg_fan_out:", fan_out)
        print("dst_ip_entropy:", dst_entropy)

        time.sleep(WINDOW_SIZE)

if __name__ == "__main__":
    run()
