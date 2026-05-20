import React, { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { getAlerts, getAlertDetails } from "../api";
import AlertDetails from "../components/AlertDetails";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [score, setScore] = useState(0);
  const [details, setDetails] = useState({});

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, []);

  async function fetchAll() {
    try {
      const a = await getAlerts();
      const d = await getAlertDetails();

      // ✅ IMPORTANT FIX
      const alertList = Array.isArray(a?.alerts) ? a.alerts : [];

      setAlerts(alertList);
      setScore(a?.score ?? 0);
      setDetails(d || {});
    } catch (e) {
      console.error("Alert fetch error", e);
    }
  }

  return (
    <Layout>
      <h2>Alerts</h2>

      {/* ML score display */}
      <div style={{ marginBottom: 16, color: "#94a3b8" }}>
        ML Anomaly Score: <b>{score}</b>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
        <div>
          {alerts.length === 0 ? (
            <div style={{ padding: 12, background: "#082023", borderRadius: 8 }}>
              No active alerts
            </div>
          ) : (
            alerts.map((a, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  borderRadius: 8,
                  background:
                    a.severity === "high"
                      ? "#ff4d6d33"
                      : a.severity === "medium"
                      ? "#facc1533"
                      : "#00ff9c22",
                }}
              >
                <div style={{ fontWeight: 800, textTransform: "uppercase" }}>
                  {a.severity}
                </div>
                <div style={{ fontWeight: 700 }}>{a.reason}</div>
                <div style={{ marginTop: 6 }}>{a.explanation}</div>
                {/* timestamp and data snapshot if available */}
                {a.timestamp && (
                  <div style={{ marginTop: 8, color: "var(--label)", fontSize: 12 }}>
                    Time: {new Date(a.timestamp).toLocaleString()}
                  </div>
                )}
                {typeof a.total_bytes !== 'undefined' && (
                  <div style={{ marginTop: 6, color: "var(--label)", fontSize: 12 }}>
                    Data: {(a.total_bytes / (1024 * 1024)).toFixed(2)} MB — Throughput: {a.throughput_mbps ?? "-"} MB/s
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div>
          <h4>Alert Details</h4>
          <AlertDetails details={details} />
        </div>
      </div>
    </Layout>
  );
}
