import pandas as pd
import os

CSV_PATH = r"C:\VENOM\Coding\NOP\network-observability\data\flows.csv"

def load_recent_flows(rows=200):
    try:
        if not os.path.exists(CSV_PATH):
            print("CSV not found:", CSV_PATH)
            return None

        df = pd.read_csv(CSV_PATH)
        if df.empty:
            print("CSV empty")
            return None

        return df.tail(rows)

    except Exception as e:
        print("CSV read error:", e)
        return None
