import React, { useEffect, useState } from "react";

import Layout from "../layout/Layout";

import ProtocolChart from "../components/ProtocolChart";

import TopTalkers from "../components/TopTalkers";

import LineChartCard from "../components/LineChartCard";

import {
  getMetrics,
  getProtocols,
  getTopTalkers
} from "../api";

import {
  getStoredMetrics,
  pushMetricsBatch,
  subscribe
} from "../stores/metricsStore";

import theme from "../theme";

export default function TrafficAnalysis() {

  const [metrics, setMetrics] = useState([]);

  const [protocols, setProtocols] = useState([]);

  const [top, setTop] = useState({
    src: [],
    dst: []
  });

  const [unit, setUnit] = useState("MB");

  /* ---------------- FETCH LOOP ---------------- */

  useEffect(() => {

    setMetrics(
      getStoredMetrics().slice(-120)
    );

    const unsub =
      subscribe((all) =>
        setMetrics(all.slice(-120))
      );

    fetchAll();

    const id =
      setInterval(fetchAll, 5000);

    return () => {

      clearInterval(id);

      unsub();

    };

  }, []);

  async function fetchAll() {

    try {

      const m = await getMetrics();

      const p = await getProtocols();

      const t = await getTopTalkers();

      if (m.data) {

        pushMetricsBatch(m.data);

      }

      setProtocols(p || []);

      setTop(
        t || {
          src: [],
          dst: []
        }
      );

    } catch (e) {

      console.error(e);

    }

  }

  /* ---------------- CHART DATA ---------------- */

  const chartData =
    metrics.map((m) => {

      const bytes =
        m.total_bytes || 0;

      const value =
        unit === "MB"
          ? Number(
              (
                bytes /
                (1024 * 1024)
              ).toFixed(2)
            )
          : Number(
              (
                bytes / 1024
              ).toFixed(2)
            );

      return {

        time:
          new Date(m.timestamp)
            .toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata"
            }),

        value,

        unit

      };

    });

  /* ---------------- HELPERS ---------------- */

  const latest =
    metrics[metrics.length - 1] || {};

  const latestTraffic =
    latest.total_bytes
      ? (
          latest.total_bytes /
          (1024 * 1024)
        ).toFixed(2)
      : "0.00";

  /* ---------------- UI ---------------- */

  return (

    <Layout>

      {/* HEADER */}
      <div
        style={{
          display: "flex",

          justifyContent: "space-between",

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
            Traffic Analysis
          </h2>

          <div
            style={{
              color: "#64748b",

              fontSize: 14
            }}
          >
            Realtime traffic insights and protocol analytics
          </div>

        </div>

        {/* UNIT SELECT */}
        <div
          className="card"
          style={{
            marginBottom: 0,

            padding: "14px 18px",

            display: "flex",

            alignItems: "center",

            gap: 12
          }}
        >

          <div
            style={{
              color: "#64748b",

              fontSize: 13,

              fontWeight: 700
            }}
          >
            DISPLAY UNIT
          </div>

          <select
            value={unit}
            onChange={(e) =>
              setUnit(e.target.value)
            }
            style={{
              padding: "8px 12px",

              borderRadius: 12,

              border:
                "1px solid rgba(15,23,42,0.08)",

              background:
                "rgba(255,255,255,0.8)",

              outline: "none",

              fontWeight: 700
            }}
          >
            <option value="KB">
              KB
            </option>

            <option value="MB">
              MB
            </option>

          </select>

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
          title="Current Traffic"
          value={`${latestTraffic} MB`}
          accent={theme.primary}
        />

        <KPI
          title="Active Protocols"
          value={protocols.length}
          accent={theme.success}
        />

        <KPI
          title="Top Sources"
          value={top.src?.length || 0}
          accent={theme.warning}
        />

      </div>

      {/* TRAFFIC CHART */}
      <div
        className="card"
        style={{
          marginBottom: 24
        }}
      >

        <div
          style={{
            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            marginBottom: 18,

            flexWrap: "wrap",

            gap: 12
          }}
        >

          <div>

            <div
              style={{
                fontWeight: 800,

                fontSize: 18
              }}
            >
              Traffic Over Time
            </div>

            <div
              style={{
                color: "#64748b",

                fontSize: 13,

                marginTop: 4
              }}
            >
              Live network throughput visualization
            </div>

          </div>

          <div
            style={{
              fontSize: 13,

              color: "#64748b",

              fontWeight: 700
            }}
          >
            Last 120 samples
          </div>

        </div>

        <LineChartCard
          data={chartData}
          dataKey="value"
          yLabel={unit}
          stroke={theme.primary}
        />

      </div>

      {/* LOWER GRID */}
      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "1fr 420px",

          gap: 22,

          alignItems: "start"
        }}
      >

        {/* PROTOCOLS */}
        <div
          className="card"
          style={{
            minHeight: 420
          }}
        >

          <div
            style={{
              marginBottom: 18
            }}
          >

            <div
              style={{
                fontWeight: 800,

                fontSize: 18
              }}
            >
              Protocol Distribution
            </div>

            <div
              style={{
                color: "#64748b",

                fontSize: 13,

                marginTop: 4
              }}
            >
              Protocol usage breakdown
            </div>

          </div>

          <div
            style={{
              height: 320,

              display: "flex",

              justifyContent: "center",

              alignItems: "center"
            }}
          >

            <ProtocolChart
              data={protocols}
            />

          </div>

        </div>

        {/* TALKERS */}
        <div
          className="card"
          style={{
            minHeight: 420,
            overflow: "hidden"
          }}
        >
          <TopTalkers data={top} />
        </div>
        
              </div>
        
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

      <div className="kpi-title">
        {title}
      </div>

      <div className="kpi-value">
        {value}
      </div>

    </div>

  );

}