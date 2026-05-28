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

      const alertList = Array.isArray(a?.data?.alerts)
        ? a.data.alerts
        : [];

      setAlerts([...alertList]);

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

      {/* ML SCORE */}
      <div
        style={{
          marginBottom: 20,
          color: "#94a3b8",
          fontSize: 18,
          fontWeight: 500
        }}
      >
        ML Anomaly Score:
        <b
          style={{
            marginLeft: 8,
            color:
              score > 0.285
                ? "#ff6b6b"
                : score > 0.20
                ? "#ffb84d"
                : "#22c55e"
          }}
        >
          {score.toFixed(3)}
        </b>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 20,
          alignItems: "start"
        }}
      >

        {/* LEFT SIDE */}
        <div>

          {alerts.length === 0 ? (

            <div
              style={{
                padding: 16,
                background: "#082023",
                borderRadius: 12,
                color: "white",
                fontWeight: 500
              }}
            >
              No active alerts
            </div>

          ) : (

            alerts.map((alert, i) => (

              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  marginBottom: 12,
                  borderRadius: 14,

                  background:
                    alert.severity === "critical"
                      ? "rgba(255, 77, 79, 0.10)"
                      : "rgba(255, 176, 32, 0.10)",

                  border:
                    alert.severity === "critical"
                      ? "1px solid rgba(255,77,79,0.35)"
                      : "1px solid rgba(255,176,32,0.35)",

                  backdropFilter: "blur(6px)"
                }}
              >

                {/* SEVERITY */}
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: 1,
                    textTransform: "uppercase",

                    color:
                      alert.severity === "critical"
                        ? "#ff6b6b"
                        : "#ffb84d",

                    marginBottom: 10
                  }}
                >
                  {alert.severity}
                </div>

                {/* SCORE */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                    fontSize: 14
                  }}
                >
                  <span>ML Score</span>
                  <b>{alert.score?.toFixed(3)}</b>
                </div>

                {/* TRAFFIC */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                    fontSize: 14
                  }}
                >
                  <span>Traffic</span>
                  <b>
                    {(
                      (alert.total_bytes || 0) /
                      (1024 * 1024)
                    ).toFixed(2)} MB
                  </b>
                </div>

                {/* ENTROPY */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                    fontSize: 14
                  }}
                >
                  <span>Entropy</span>
                  <b>{alert.entropy?.toFixed(2)}</b>
                </div>

                {/* FANOUT */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                    fontSize: 14
                  }}
                >
                  <span>Fan-Out</span>
                  <b>{alert.fan_out?.toFixed(2)}</b>
                </div>

                {/* TIME */}
                {alert.timestamp && (

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      opacity: 0.65
                    }}
                  >
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>

                )}

              </div>

            ))

          )}

        </div>

        {/* RIGHT SIDE */}
        <div>

          <h4 style={{ marginBottom: 12 }}>
            Alert Details
          </h4>

          <AlertDetails details={details} />

        </div>

      </div>

    </Layout>

  );
}