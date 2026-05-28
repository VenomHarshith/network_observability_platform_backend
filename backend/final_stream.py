from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from storage import load_recent_flows
from metrics import compute_metrics
from ml_pipeline import run_pipeline

import pandas as pd
import os
import time
from typing import List, Dict

# =========================
# GLOBAL LIVE STORAGE
# =========================
LIVE_FLOWS = []
LIVE_ALERTS = []

# =========================
# HELPERS
# =========================
def get_live_dataframe():

    global LIVE_FLOWS

    if not LIVE_FLOWS:
        return pd.DataFrame()

    return pd.DataFrame(LIVE_FLOWS)

# =========================
# FASTAPI INIT
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# METRICS API
# =========================
@app.get("/api/metrics/latest")
def get_latest_metrics():

    df = get_live_dataframe()

    metrics = compute_metrics(df)

    if not metrics:
        return []

    # =========================
    # SAVE HISTORY CSV
    # =========================
    try:

        history_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "data",
            "metrics_history.csv"
        )

        os.makedirs(
            os.path.dirname(history_path),
            exist_ok=True
        )

        row = metrics[0].copy()

        cols = [
            "timestamp",
            "total_bytes",
            "throughput_mbps",
            "dst_ip_entropy",
            "avg_fan_out"
        ]

        df_row = pd.DataFrame([
            {
                k: row.get(k, None)
                for k in cols
            }
        ])

        header = not os.path.exists(history_path)

        df_row.to_csv(
            history_path,
            mode="a",
            header=header,
            index=False
        )

    except Exception as e:
        print("Failed to persist metrics history:", e)

    return metrics

# =========================
# ALERTS API
# =========================
@app.get("/api/alerts")
def get_alerts():

    global LIVE_ALERTS

    return {
        "alerts": LIVE_ALERTS
    }

# =========================
# PROTOCOL STATS
# =========================
def protocol_stats(df: pd.DataFrame) -> List[Dict]:

    if df is None or df.empty:
        return []

    try:

        df = df.copy()

        df["bytes"] = pd.to_numeric(
            df["bytes"],
            errors="coerce"
        ).fillna(0)

        grouped = (
            df.groupby("protocol")["bytes"]
            .sum()
            .sort_values(ascending=False)
        )

        return [
            {
                "protocol": p,
                "bytes": int(b)
            }
            for p, b in grouped.items()
        ]

    except Exception as e:
        print("protocol_stats error:", e)
        return []

# =========================
# TOP TALKERS
# =========================
def top_talkers(df, top_n=5):

    try:

        if df is None or df.empty:
            return {"src": [], "dst": []}

        required_cols = [
            "src_ip",
            "dst_ip",
            "bytes"
        ]

        for col in required_cols:

            if col not in df.columns:
                return {
                    "error": f"Missing column: {col}",
                    "available_columns": list(df.columns)
                }

        df["bytes"] = pd.to_numeric(
            df["bytes"],
            errors="coerce"
        ).fillna(0)

        src_stats = (
            df.groupby("src_ip")["bytes"]
            .sum()
            .reset_index()
            .sort_values(by="bytes", ascending=False)
            .head(top_n)
        )

        dst_stats = (
            df.groupby("dst_ip")["bytes"]
            .sum()
            .reset_index()
            .sort_values(by="bytes", ascending=False)
            .head(top_n)
        )

        return {
            "src": [
                {
                    "ip": str(row["src_ip"]),
                    "bytes": float(row["bytes"])
                }
                for _, row in src_stats.iterrows()
            ],
            "dst": [
                {
                    "ip": str(row["dst_ip"]),
                    "bytes": float(row["bytes"])
                }
                for _, row in dst_stats.iterrows()
            ]
        }

    except Exception as e:
        return {
            "error": str(e)
        }

# =========================
# TOPOLOGY
# =========================
def topology(df: pd.DataFrame) -> List[Dict]:

    if df is None or df.empty:
        return []

    try:

        df = df.copy()

        df["bytes"] = pd.to_numeric(
            df["bytes"],
            errors="coerce"
        ).fillna(0)

        edges = (
            df.groupby(["src_ip", "dst_ip"])["bytes"]
            .sum()
            .reset_index()
            .sort_values(by="bytes", ascending=False)
        )

        return [
            {
                "src_ip": r["src_ip"],
                "dst_ip": r["dst_ip"],
                "bytes": int(r["bytes"])
            }
            for _, r in edges.iterrows()
        ]

    except Exception as e:
        print("topology error:", e)
        return []

# =========================
# ALERT DETAILS
# =========================
def alert_details(df: pd.DataFrame) -> Dict:

    if df is None or df.empty:
        return {}

    try:

        metrics = compute_metrics(df)

        m = metrics[0] if metrics else {}

        top = top_talkers(df, top_n=3)

        proto = protocol_stats(df)

        reasons = []

        if m.get("dst_ip_entropy", 0) > 3.5:
            reasons.append(
                "High destination IP entropy suggests scanning behavior."
            )

        if m.get("avg_fan_out", 0) > 5:
            reasons.append(
                "High fan-out indicates possible lateral movement."
            )

        if m.get("throughput_mbps", 0) > 50:
            reasons.append(
                "Large throughput spike observed."
            )

        if not reasons:
            reasons.append(
                "No single clear cause detected."
            )

        return {
            "metrics": m,
            "top_talkers": top,
            "protocols": proto[:8],
            "explanations": reasons
        }

    except Exception as e:
        print("alert_details error:", e)
        return {}

# =========================
# FLOW INGESTION
# =========================
@app.post("/flows")
async def receive_flows(request: Request):

    global LIVE_FLOWS
    global LIVE_ALERTS

    data = await request.json()

    if isinstance(data, list):
        LIVE_FLOWS.extend(data)
    else:
        LIVE_FLOWS.append(data)

    # keep latest 5000 flows
    LIVE_FLOWS = LIVE_FLOWS[-5000:]

    # =========================
    # RUN ML PIPELINE
    # =========================
    try:

        print("RUN_PIPELINE CALLED")

        LIVE_ALERTS = run_pipeline(LIVE_FLOWS)

        print("PIPELINE FINISHED")

    except Exception as e:

        print("PIPELINE ERROR:", e)

    return {
        "status": "success",
        "stored_flows": len(LIVE_FLOWS)
    }

# =========================
# FLOW API
# =========================
@app.get("/api/flows")
def get_live_flows():
    return LIVE_FLOWS[-100:]

# =========================
# PROTOCOL API
# =========================
@app.get("/api/protocols")
def api_protocols():

    df = get_live_dataframe()

    return protocol_stats(df)

# =========================
# TOP TALKERS API
# =========================
@app.get("/api/top-talkers")
def api_top_talkers():

    df = get_live_dataframe()

    return top_talkers(df, top_n=5)

# =========================
# TOPOLOGY API
# =========================
@app.get("/api/topology")
def api_topology():

    df = get_live_dataframe()

    return topology(df)

# =========================
# ALERT DETAILS API
# =========================
@app.get("/api/alerts/details")
def api_alert_details():

    df = get_live_dataframe()

    return alert_details(df)

# =========================
# METRICS HISTORY API
# =========================
@app.get("/api/metrics/history")
def api_metrics_history(
    minutes: int = Query(60, ge=1, le=24 * 60)
):

    history_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "data",
        "metrics_history.csv"
    )

    if not os.path.exists(history_path):
        return []

    try:

        hdf = pd.read_csv(history_path)

        if hdf.empty:
            return []

        now_ms = int(time.time() * 1000)

        cutoff = now_ms - (minutes * 60 * 1000)

        hdf = hdf[hdf["timestamp"] >= cutoff]

        return hdf.to_dict(orient="records")

    except Exception as e:

        print("history read error:", e)

        return []