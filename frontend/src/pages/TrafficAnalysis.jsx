import React, { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import ProtocolChart from "../components/ProtocolChart";
import TopTalkers from "../components/TopTalkers";
import LineChartCard from "../components/LineChartCard";
import { getMetrics, getProtocols, getTopTalkers } from "../api";
import { getStoredMetrics, pushMetricsBatch, subscribe } from "../stores/metricsStore";

export default function TrafficAnalysis() {
  const [metrics, setMetrics] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [top, setTop] = useState({ src: [], dst: [] });

  useEffect(() => {
    // initialize from shared store and subscribe for updates
    setMetrics(getStoredMetrics().slice(-120));
    const unsub = subscribe((all) => setMetrics(all.slice(-120)));

    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => {
      clearInterval(id);
      unsub();
    };
  }, []);

  async function fetchAll() {
    const m = await getMetrics();
    const p = await getProtocols();
    const t = await getTopTalkers();
    if (m.data) pushMetricsBatch(m.data);
    setProtocols(p || []);
    setTop(t || { src: [], dst: [] });
  }

  const [unit, setUnit] = useState("MB");

  const chartData = metrics.map((m) => {
    const bytes = m.total_bytes || 0;
    const value = unit === "MB" ? Number((bytes / (1024 * 1024)).toFixed(2)) : Number((bytes / 1024).toFixed(2));
    return { time: new Date(m.timestamp).toLocaleTimeString(), value, unit };
  });

  return (
    <Layout>
      <h2>Traffic Analysis</h2>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <strong>Traffic Over Time</strong>
          </div>
          <div>
            <label style={{ marginRight: 8 }}>Unit:</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="KB">KB</option>
              <option value="MB">MB</option>
            </select>
          </div>
        </div>
        <LineChartCard data={chartData} dataKey="value" yLabel={unit} stroke={require("../theme").default.primary} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
        <div>
          <div style={{ marginBottom: 12 }}><strong>Protocol Distribution</strong></div>
          <ProtocolChart data={protocols} />
        </div>

        <div>
          <div style={{ marginBottom: 12 }}><strong>Top Talkers</strong></div>
          <TopTalkers data={top} />
        </div>
      </div>
    </Layout>
  );
}
