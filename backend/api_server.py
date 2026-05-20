from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.metrics import metrics_buffer, flow_buffer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/api/metrics/latest")
def get_latest_metrics():
    return metrics_buffer[-1] if metrics_buffer else {}


@app.get("/api/flows/latest")
def get_latest_flows():
    return flow_buffer[-1] if flow_buffer else []
