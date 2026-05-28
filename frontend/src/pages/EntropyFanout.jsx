import React, {
  useEffect,
  useState
} from "react";

import Layout from "../layout/Layout";

import LineChartCard
from "../components/LineChartCard";

import { getMetrics }
from "../api";

import {
  getStoredMetrics,
  pushMetricsBatch,
  subscribe
} from "../stores/metricsStore";

import theme from "../theme";

export default function EntropyFanout() {

  const [metrics, setMetrics] =
    useState([]);

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

      if (m.data) {

        pushMetricsBatch(m.data);

      }

    } catch (e) {

      console.error(e);

    }

  }

  /* ---------------- CHART DATA ---------------- */

  const chartEntropy =
    metrics.map((m) => ({

      time:
        new Date(m.timestamp)
          .toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata"
          }),

      entropy:
        Number(
          (
            m.dst_ip_entropy || 0
          ).toFixed(2)
        )

    }));

  const chartFanout =
    metrics.map((m) => ({

      time:
        new Date(m.timestamp)
          .toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata"
          }),

      fanout:
        Number(
          (
            m.avg_fan_out || 0
          ).toFixed(2)
        )

    }));

  /* ---------------- HELPERS ---------------- */

  const latest =
    metrics[metrics.length - 1] || {};

  const entropyValue =
    latest.dst_ip_entropy?.toFixed(2)
    || "0.00";

  const fanoutValue =
    latest.avg_fan_out?.toFixed(2)
    || "0.00";

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
            Entropy & Fan-Out
          </h2>

          <div
            style={{
              color: "#64748b",

              fontSize: 14
            }}
          >
            Behavioral analytics and traffic dispersion monitoring
          </div>

        </div>

        {/* LIVE STATUS */}
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

              background: "#10b981",

              boxShadow:
                "0 0 12px rgba(16,185,129,0.6)"
            }}
          />

          <div
            style={{
              fontWeight: 700,

              fontSize: 14
            }}
          >
            Live Analysis
          </div>

        </div>

      </div>

      {/* KPI ROW */}
      <div
        className="grid-2"
        style={{
          marginBottom: 24
        }}
      >

        <KPI
          title="Destination Entropy"
          value={entropyValue}
          accent={theme.success}
        />

        <KPI
          title="Average Fan-Out"
          value={fanoutValue}
          accent={theme.warning}
        />

      </div>

      {/* CHARTS */}
      <div
        className="grid-2"
        style={{
          alignItems: "start"
        }}
      >

        {/* ENTROPY */}
        <div className="card">

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
              Entropy Trend
            </div>

            <div
              style={{
                color: "#64748b",

                fontSize: 13,

                marginTop: 4
              }}
            >
              Measures randomness of destination traffic
            </div>

          </div>

          <div
            style={{
              height: 320
            }}
          >

            <LineChartCard
              data={chartEntropy}
              dataKey="entropy"
              yLabel="Entropy"
              stroke={theme.success}
            />

          </div>

        </div>

        {/* FANOUT */}
        <div className="card">

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
              Fan-Out Trend
            </div>

            <div
              style={{
                color: "#64748b",

                fontSize: 13,

                marginTop: 4
              }}
            >
              Indicates average destination spread per source
            </div>

          </div>

          <div
            style={{
              height: 320
            }}
          >

            <LineChartCard
              data={chartFanout}
              dataKey="fanout"
              yLabel="Fan-Out"
              stroke={theme.warning}
            />

          </div>

        </div>

      </div>

      {/* INSIGHT PANEL */}
      <div
        className="card"
        style={{
          marginTop: 24
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
            Behavioral Insights
          </div>

          <div
            style={{
              color: "#64748b",

              fontSize: 13,

              marginTop: 4
            }}
          >
            Understanding network communication behavior
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

          <InsightCard
            title="High Entropy"
            text="Higher entropy can indicate broader traffic dispersion, scanning behavior, or diversified communication patterns."
          />

          <InsightCard
            title="Low Entropy"
            text="Lower entropy usually represents concentrated traffic targeting fewer destinations."
          />

          <InsightCard
            title="High Fan-Out"
            text="Large fan-out values may suggest aggressive connection spreading or abnormal communication expansion."
          />

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

/* ---------------- INSIGHT CARD ---------------- */

function InsightCard({
  title,
  text
}) {

  return (

    <div
      style={{
        padding: "18px",

        borderRadius: 18,

        background:
          "rgba(248,250,252,0.8)",

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