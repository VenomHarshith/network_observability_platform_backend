import React, { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import LineChartCard from "../components/LineChartCard";
import { getMetrics } from "../api";
import { getStoredMetrics, pushMetricsBatch, subscribe } from "../stores/metricsStore";

export default function EntropyFanout() {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    // initialize from shared store and subscribe
    setMetrics(getStoredMetrics().slice(-120));
    const unsub = subscribe((all) => setMetrics(all.slice(-120)));

    // also fetch and push live batches (so store stays populated)
    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => {
      clearInterval(id);
      unsub();
    };
  }, []);

  async function fetchAll() {
    const m = await getMetrics();
    if (m.data) pushMetricsBatch(m.data);
  }

  const chartEntropy = metrics.map((m) => ({ time: new Date(m.timestamp).toLocaleTimeString(), entropy: m.dst_ip_entropy }));
  const chartFanout = metrics.map((m) => ({ time: new Date(m.timestamp).toLocaleTimeString(), fanout: m.avg_fan_out }));

  return (
    <Layout>
      <h2>Entropy & Fan-Out</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <LineChartCard data={chartEntropy} dataKey="entropy" yLabel="Entropy" stroke={require("../theme").default.success} />
        <LineChartCard data={chartFanout} dataKey="fanout" yLabel="Fan-Out" stroke={require("../theme").default.warning} />
      </div>
    </Layout>
  );
}
