def generate_alert(metrics, score):
    """Generate a list of alert dicts and attach metric snapshot (timestamp, bytes, throughput).

    `metrics` should be a dict produced by `compute_metrics()` containing keys like
    `timestamp`, `total_bytes`, `throughput_mbps`, `dst_ip_entropy`, `avg_fan_out`.
    """
    alerts = []

    bytes_ = metrics.get("total_bytes", 0)
    entropy = metrics.get("dst_ip_entropy", 0)
    fanout = metrics.get("avg_fan_out", 0)
    ts = metrics.get("timestamp", None)

    if score > 0.8:
        alerts.append({
            "severity": "critical",
            "reason": "High ML anomaly score",
            "explanation": f"Traffic behavior highly abnormal (score={score})",
            "timestamp": ts,
            "total_bytes": bytes_,
            "throughput_mbps": metrics.get("throughput_mbps", None),
        })

    if entropy > 3.8:
        alerts.append({
            "severity": "high",
            "reason": "High destination entropy",
            "explanation": "Possible scanning / probing behavior",
            "timestamp": ts,
            "total_bytes": bytes_,
            "throughput_mbps": metrics.get("throughput_mbps", None),
        })

    if fanout > 6:
        alerts.append({
            "severity": "high",
            "reason": "High fan-out",
            "explanation": "Possible lateral movement or worm activity",
            "timestamp": ts,
            "total_bytes": bytes_,
            "throughput_mbps": metrics.get("throughput_mbps", None),
        })

    if bytes_ > 8 * 1024 * 1024:
        alerts.append({
            "severity": "medium",
            "reason": "Traffic spike",
            "explanation": "Unusual bandwidth surge detected",
            "timestamp": ts,
            "total_bytes": bytes_,
            "throughput_mbps": metrics.get("throughput_mbps", None),
        })

    return alerts
