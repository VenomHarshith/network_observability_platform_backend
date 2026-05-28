import React, {
  useEffect,
  useState
} from "react";

import Layout from "../layout/Layout";

import { getMetrics }
from "../api";

export default function Settings() {

  const [status, setStatus] =
    useState({});

  /* ---------------- FETCH STATUS ---------------- */

  useEffect(() => {

    fetchStatus();

  }, []);

  async function fetchStatus() {

    try {

      const m =
        await getMetrics();

      setStatus({

        api:
          m ? "Operational" : "Down",

        last:
          (
            m &&
            m.data &&
            m.data.length
          )
            ? new Date(
                m.data[
                  m.data.length - 1
                ].timestamp
              ).toLocaleString(
                "en-IN",
                {
                  timeZone:
                    "Asia/Kolkata"
                }
              )
            : "-",

        samples:
          m?.data?.length || 0

      });

    } catch {

      setStatus({

        api: "Down",

        last: "-",

        samples: 0

      });

    }

  }

  /* ---------------- UI ---------------- */

  return (

    <Layout>

      {/* HEADER */}
      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          flexWrap: "wrap",

          gap: 16,

          marginBottom: 26
        }}
      >

        <div>

          <h2
            style={{
              marginBottom: 8
            }}
          >
            Settings & Status
          </h2>

          <div
            style={{
              color: "#64748b",

              fontSize: 14
            }}
          >
            Platform configuration and backend health monitoring
          </div>

        </div>

        {/* STATUS BADGE */}
        <div
          className="card"
          style={{
            marginBottom: 0,

            padding:
              "14px 18px",

            display: "flex",

            alignItems: "center",

            gap: 10
          }}
        >

          <span
            style={{
              width: 10,
              height: 10,

              borderRadius: "50%",

              background:
                status.api === "Operational"
                  ? "#10b981"
                  : "#ef4444",

              boxShadow:
                status.api === "Operational"
                  ? "0 0 12px rgba(16,185,129,0.6)"
                  : "0 0 12px rgba(239,68,68,0.6)"
            }}
          />

          <div
            style={{
              fontWeight: 700,

              fontSize: 14
            }}
          >
            {status.api}
          </div>

        </div>

      </div>

      {/* STATUS GRID */}
      <div
        className="grid-3"
        style={{
          marginBottom: 24
        }}
      >

        <StatusCard
          title="Backend API"
          value={status.api}
          color={
            status.api === "Operational"
              ? "#10b981"
              : "#ef4444"
          }
        />

        <StatusCard
          title="Metrics Samples"
          value={status.samples}
          color="#3b82f6"
        />

        <StatusCard
          title="Last Telemetry"
          value={status.last || "-"}
          color="#f59e0b"
          small
        />

      </div>

      {/* SYSTEM INFO */}
      <div className="card">

        <div
          style={{
            marginBottom: 22
          }}
        >

          <div
            style={{
              fontWeight: 800,

              fontSize: 18
            }}
          >
            System Overview
          </div>

          <div
            style={{
              color: "#64748b",

              fontSize: 13,

              marginTop: 4
            }}
          >
            Current observability platform status
          </div>

        </div>

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",

            gap: 18
          }}
        >

          <InfoCard
            title="Realtime Monitoring"
            text="Network telemetry and analytics are being continuously ingested and processed."
          />

          <InfoCard
            title="ML Detection Engine"
            text="Isolation Forest anomaly detection pipeline is actively evaluating incoming traffic behavior."
          />

          <InfoCard
            title="Topology Analysis"
            text="Live traffic relationships and communication patterns are available through Flow Explorer."
          />

        </div>

      </div>

    </Layout>

  );

}

/* ---------------- STATUS CARD ---------------- */

function StatusCard({
  title,
  value,
  color,
  small
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

      <div
        className="kpi-value"
        style={{
          fontSize:
            small
              ? 18
              : 30,

          lineHeight: 1.4,

          wordBreak:
            "break-word"
        }}
      >
        {value}
      </div>

    </div>

  );

}

/* ---------------- INFO CARD ---------------- */

function InfoCard({
  title,
  text
}) {

  return (

    <div
      style={{
        padding: "18px",

        borderRadius: 18,

        background:
          "rgba(248,250,252,0.85)",

        border:
          "1px solid rgba(15,23,42,0.05)"
      }}
    >

      <div
        style={{
          fontWeight: 800,

          marginBottom: 10,

          fontSize: 16
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#64748b",

          fontSize: 14,

          lineHeight: 1.7
        }}
      >
        {text}
      </div>

    </div>

  );

}