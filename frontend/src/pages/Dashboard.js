import React, {
  useEffect,
  useState
} from "react";

import Card from "../components/Card";

import LineChartCard
from "../components/LineChartCard";

import ProtocolChart
from "../components/ProtocolChart";

import TopologyGraph
from "../components/TopologyGraph";

import "./Dashboard.css";

import {
  getMetrics,
  getAlerts,
  getProtocols,
  getTopology
} from "../api";

function formatMB(bytes) {

  if (!bytes) return "0.00";

  return (
    bytes /
    (1024 * 1024)
  ).toFixed(2);

}

export default function Dashboard() {

  const [metrics, setMetrics] =
    useState([]);

  const [alerts, setAlerts] =
    useState([]);

  const [protocols, setProtocols] =
    useState([]);

  const [topology, setTopology] =
    useState([]);

  const [autoMode, setAutoMode] =
    useState(true);

  /* ---------------- FETCH LOOP ---------------- */

  useEffect(() => {

    fetchAll();

    let id = null;

    if (autoMode) {

      id =
        setInterval(fetchAll, 5000);

    }

    return () => {

      if (id) clearInterval(id);

    };

  }, [autoMode]);

  async function fetchAll() {

    try {

      const m =
        await getMetrics();

      const a =
        await getAlerts();

      const p =
        await getProtocols();

      const topo =
        await getTopology();

      setMetrics(m.data || []);

      setAlerts(
        a.data?.alerts || []
      );

      setProtocols(p || []);

      setTopology(topo || []);

    } catch (e) {

      console.error(e);

    }

  }

  /* ---------------- HELPERS ---------------- */

  const latest =
    metrics[metrics.length - 1] || {};

  const trafficData =
    metrics.map((m) => ({

      time:
        new Date(m.timestamp)
          .toLocaleTimeString(
            "en-IN",
            {
              timeZone:
                "Asia/Kolkata"
            }
          ),

      mb:
        Number(
          formatMB(
            m.total_bytes
          )
        )

    }));

  /* ---------------- UI ---------------- */

  return (

    <div
      className="dashboard-container"
    >

      {/* HEADER */}
      <div className="header-row">

        <div>

          <div className="title">
            Network Observability Platform
          </div>

          <div className="meta">

            <span
              style={{
                width: 10,
                height: 10,

                borderRadius: "50%",

                background: "#10b981",

                display: "inline-block",

                marginRight: 10,

                boxShadow:
                  "0 0 12px rgba(16,185,129,0.6)"
              }}
            />

            Operations Center — Live telemetry

          </div>

        </div>

        {/* CONTROLS */}
        <div className="controls">

          <button
            className="btn btn-primary"
            onClick={fetchAll}
          >
            Refresh
          </button>

          <button
            className="btn btn-ghost"
            onClick={() =>
              setAutoMode((v) => !v)
            }
          >
            {autoMode
              ? "Auto ON"
              : "Auto OFF"}
          </button>

        </div>

      </div>

      {/* KPI ROW */}
      <div className="grid-3">

        <KPI
          title="Traffic Volume"
          value={`${formatMB(latest.total_bytes)} MB`}
          color="#3b82f6"
        />

        <KPI
          title="Entropy"
          value={
            latest.dst_ip_entropy
              ?.toFixed(2)
              || "0.00"
          }
          color="#10b981"
        />

        <KPI
          title="Fan-Out"
          value={
            latest.avg_fan_out
              ?.toFixed(2)
              || "0.00"
          }
          color="#f59e0b"
        />

      </div>

      {/* TRAFFIC + PROTOCOL */}
      <div
        className="grid-2"
        style={{
          marginTop: 24
        }}
      >

        <Card title="📈 Traffic Overview">

          <LineChartCard
            data={trafficData}
            dataKey="mb"
            yLabel="MB"
          />

        </Card>

        <Card title="🥧 Protocol Distribution">

          <div
            style={{
              height: 320,

              display: "flex",

              alignItems: "center",

              justifyContent: "center"
            }}
          >

            <ProtocolChart
              data={protocols}
            />

          </div>

        </Card>

      </div>

      {/* TOPOLOGY */}
      <div
        style={{
          marginTop: 24
        }}
      >

        <Card title="🌐 Live Network Topology">

          <div
            style={{
              height: 500
            }}
          >

            <TopologyGraph
              edges={topology}
            />

          </div>

        </Card>

      </div>

      {/* ALERTS */}
      <div
        style={{
          marginTop: 24
        }}
      >

        <Card title="🚨 Recent ML Alerts">

          {alerts.length === 0 ? (

            <div className="alert-empty">

              ✔ No abnormal behavior detected

            </div>

          ) : (

            <div
              style={{
                display: "flex",

                flexDirection: "column",

                gap: 14
              }}
            >

              {alerts
                .slice(0, 4)
                .map((a, i) => (

                  <div
                    key={i}
                    style={{

                      padding:
                        "16px",

                      borderRadius: 18,

                      background:
                        a.severity === "critical"
                          ? "rgba(239,68,68,0.10)"
                          : "rgba(245,158,11,0.10)",

                      border:
                        a.severity === "critical"
                          ? "1px solid rgba(239,68,68,0.18)"
                          : "1px solid rgba(245,158,11,0.18)"

                    }}
                  >

                    <div
                      style={{
                        fontWeight: 800,

                        textTransform:
                          "uppercase",

                        fontSize: 12,

                        letterSpacing: 1,

                        marginBottom: 8,

                        color:
                          a.severity === "critical"
                            ? "#dc2626"
                            : "#d97706"
                      }}
                    >
                      {a.severity}
                    </div>

                    <div
                      style={{
                        fontWeight: 700,

                        marginBottom: 6
                      }}
                    >
                      {a.reason}
                    </div>

                    <div
                      style={{
                        color: "#64748b",

                        lineHeight: 1.6,

                        fontSize: 14
                      }}
                    >
                      {a.explanation}
                    </div>

                  </div>

                ))}

            </div>

          )}

        </Card>

      </div>

    </div>

  );

}

/* ---------------- KPI ---------------- */

function KPI({
  title,
  value,
  color
}) {

  return (

    <div
      className="kpi"
      style={{
        borderTop:
          `4px solid ${color}`
      }}
    >

      <div className="kpi-title">
        {title}
      </div>

      <div className="kpi-value">
        {value}
      </div>

    </div>

  );

}