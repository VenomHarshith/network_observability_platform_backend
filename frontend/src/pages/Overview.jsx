import { useEffect, useState } from "react";
import { getMetrics, getAlerts, getProtocols } from "../api";
import {
  getStoredMetrics,
  pushMetricsBatch,
  subscribe
} from "../stores/metricsStore";

import Layout from "../layout/Layout";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

import theme from "../theme";

import ProtocolChart from "../components/ProtocolChart";

export default function Overview() {

  const [metrics, setMetrics] = useState([]);
  const [alertsObj, setAlertsObj] = useState({});
  const [internetSpeed, setInternetSpeed] = useState("--");
  const [protocols, setProtocols] = useState([]);

  /* ---------------- FETCH LOOP ---------------- */

  useEffect(() => {

    setMetrics(getStoredMetrics().slice(-120));

    const unsub =
      subscribe((all) =>
        setMetrics(all.slice(-120))
      );

    fetchData();

    fetchInternetSpeed();

    const id =
      setInterval(fetchData, 5000);

    const sid =
      setInterval(fetchInternetSpeed, 15000);

    return () => {

      clearInterval(id);

      clearInterval(sid);

      unsub();

    };

  }, []);

  const fetchData = async () => {

    try {

      const m = await getMetrics();

      const a = await getAlerts();

      const p = await getProtocols();

      if (m.data?.length) {

        pushMetricsBatch(m.data);

      }

      setAlertsObj(a.data || {});

      setProtocols(p || []);

    } catch (e) {

      console.error(e);

    }

  };

  /* ---------------- INTERNET SPEED ---------------- */

  async function fetchInternetSpeed() {

    try {

      const start = performance.now();

      await fetch(
        "https://jsonplaceholder.typicode.com/posts"
      );

      const end = performance.now();

      const latency = end - start;

      const approxMbps =
        (1000 / latency) * 5;

      setInternetSpeed(
        approxMbps.toFixed(1)
      );

    } catch {

      setInternetSpeed("N/A");

    }

  }

  /* ---------------- HELPERS ---------------- */

  const latest =
    metrics[metrics.length - 1] || {};

  const alertList =
    Array.isArray(alertsObj?.alerts)
      ? alertsObj.alerts
      : [];

  const formatMB = (b) =>
    b
      ? (b / (1024 * 1024)).toFixed(2)
      : 0;

  /* ---------------- CHART DATA ---------------- */

  const trafficData =
    metrics.map((m) => ({

      time:
        new Date(m.timestamp)
          .toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata"
          }),

      mb:
        Number(
          formatMB(m.total_bytes)
        )

    }));

  /* ---------------- UI ---------------- */

  return (

    <Layout>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 26,
          gap: 16,
          flexWrap: "wrap"
        }}
      >

        <div>

          <h2
            style={{
              marginBottom: 8
            }}
          >
            Overview
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#64748b",
              fontSize: 14
            }}
          >

            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
                boxShadow:
                  "0 0 12px rgba(16,185,129,0.7)"
              }}
            />

            Live Network Telemetry

          </div>

        </div>

        {/* INTERNET SPEED */}
        <div
          className="card"
          style={{
            padding: "16px 20px",
            minWidth: 220,
            marginBottom: 0
          }}
        >

          <div
            style={{
              color: "#64748b",
              fontSize: 13,
              marginBottom: 8
            }}
          >
            INTERNET SPEED
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: -1
            }}
          >
            {internetSpeed}

            <span
              style={{
                fontSize: 16,
                marginLeft: 6,
                color: "#64748b"
              }}
            >
              Mbps
            </span>

          </div>

        </div>

      </div>

      {/* KPI ROW */}
      <div
        className="grid-3"
        style={{
          marginBottom: 24
        }}
      >

        <KPI
          title="Traffic Volume"
          value={`${formatMB(latest.total_bytes)} MB`}
          accent={theme.primary}
        />

        <KPI
          title="Destination Entropy"
          value={
            latest.dst_ip_entropy?.toFixed(2)
            || "0.00"
          }
          accent={theme.success}
        />

        <KPI
          title="Average Fan-Out"
          value={
            latest.avg_fan_out?.toFixed(2)
            || "0.00"
          }
          accent={theme.warning}
        />

      </div>

      {/* MAIN CHARTS */}
      <div
        className="grid-2"
        style={{
          marginBottom: 24
        }}
      >

        {/* TRAFFIC */}
        <Card title="📈 Traffic Over Time">

          <div
            style={{
              height: 280
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart data={trafficData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.25}
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 12
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 12
                  }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="mb"
                  stroke={theme.primary}
                  strokeWidth={3}
                  dot={false}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </Card>

        {/* PROTOCOL */}
        <Card title="🥧 Protocol Distribution">

          <div
            style={{
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >

            <ProtocolChart data={protocols} />

          </div>

        </Card>

      </div>

      {/* ALERTS */}
      <Card title="🚨 Recent Alerts">

        {alertList.length === 0 ? (

          <div
            className="alert-empty"
          >
            ✔ No active alerts detected
          </div>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >

            {alertList.slice(0, 4).map((a, i) => (

              <div
                key={i}
                style={{

                  padding: "14px 16px",

                  borderRadius: 16,

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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8
                  }}
                >

                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 13,
                      letterSpacing: 1,
                      textTransform: "uppercase",

                      color:
                        a.severity === "critical"
                          ? "#dc2626"
                          : "#d97706"
                    }}
                  >
                    {a.severity}
                  </div>

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
                    fontSize: 14,
                    lineHeight: 1.5
                  }}
                >
                  {a.explanation}
                </div>

              </div>

            ))}

          </div>

        )}

      </Card>

    </Layout>

  );

}

/* ---------------- KPI ---------------- */

function KPI({
  title,
  value,
  accent
}) {

  return (

    <div
      className="kpi"
      style={{
        borderTop:
          `4px solid ${accent}`
      }}
    >

      <div
        className="kpi-title"
      >
        {title}
      </div>

      <div
        className="kpi-value"
      >
        {value}
      </div>

    </div>

  );

}

/* ---------------- CARD ---------------- */

function Card({
  title,
  children
}) {

  return (

    <div className="card">

      <div
        className="card-header"
        style={{
          marginBottom: 18
        }}
      >

        <h3>
          {title}
        </h3>

      </div>

      <div className="card-body">
        {children}
      </div>

    </div>

  );

}