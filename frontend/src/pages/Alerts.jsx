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

      console.log("ALERT API RESPONSE:", a);

      const d = await getAlertDetails();

      const alertList = Array.isArray(a?.data?.alerts)
        ? a.data.alerts
        : [];

      setAlerts([...alertList]);

      // highest anomaly score
      const maxScore =
        alertList.length > 0
          ? Math.max(...alertList.map(x => x.score || 0))
          : 0;

      setScore(Number(maxScore || 0));

      setDetails(d || {});

    } catch (e) {

      console.error("Alert fetch error", e);

    }
  }

  return (

    <Layout>

      <h2>Alerts</h2>

      {/* ML score */}
      <div
        style={{
          marginBottom: 16,
          color: "#94a3b8",
          fontSize: 18
        }}
      >
        ML Anomaly Score: <b>{score.toFixed(3)}</b>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: 20
        }}
      >

        {/* LEFT */}
        <div>
          <div style={{ color: "red", marginBottom: 10 }}>
            Alert count: {alerts.length}
          </div>

          <div style={{ color: "red", marginBottom: 10 }}>
            Score state: {score}
          </div>
          {alerts.length === 0 ? (

            <div
              style={{
                padding: 16,
                background: "#082023",
                borderRadius: 8,
                color: "white",
                fontWeight: 600
              }}
            >
              No active alerts
            </div>

          ) : (

            alerts.map((alert, i) => (

              <div
                key={i}
                style={{
                  padding: 16,
                  marginBottom: 12,
                  borderRadius: 10,

                  background:
                    alert.severity === "critical"
                      ? "#ff000033"
                      : a.severity === "high"
                      ? "#ffaa0033"
                      : "#00ff9c22",

                  border:
                    alert.severity === "critical"
                      ? "1px solid #ff4d4f"
                      : a.severity === "high"
                      ? "1px solid #ffb020"
                      : "1px solid #00ff9c44"
                }}
              >

                {/* severity */}
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 18,
                    textTransform: "uppercase"
                  }}
                >
                  {a.severity}
                </div>

                {/* score */}
                <div style={{ marginTop: 10 }}>
                  ML anomaly score:
                  <b style={{ marginLeft: 6 }}>
                    {a.score?.toFixed(3)}
                  </b>
                </div>

                {/* traffic */}
                <div style={{ marginTop: 8 }}>
                  Traffic:
                  <b style={{ marginLeft: 6 }}>
                    {(
                      (a.total_bytes || 0) /
                      (1024 * 1024)
                    ).toFixed(2)} MB
                  </b>
                </div>

                {/* entropy */}
                <div style={{ marginTop: 8 }}>
                  Entropy:
                  <b style={{ marginLeft: 6 }}>
                    {a.entropy?.toFixed(2)}
                  </b>
                </div>

                {/* fanout */}
                <div style={{ marginTop: 8 }}>
                  Fan-Out:
                  <b style={{ marginLeft: 6 }}>
                    {a.fan_out?.toFixed(2)}
                  </b>
                </div>

                {/* timestamp */}
                {a.timestamp && (

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: "#cbd5e1"
                    }}
                  >
                    Time:
                    {" "}
                    {new Date(a.timestamp).toLocaleString()}
                  </div>

                )}

              </div>

            ))

          )}

        </div>

        {/* RIGHT */}
        <div>

          <h4>Alert Details</h4>

          <AlertDetails details={details} />

        </div>

      </div>

    </Layout>

  );
}