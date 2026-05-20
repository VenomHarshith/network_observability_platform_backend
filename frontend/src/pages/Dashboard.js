import React, { useEffect, useState, useCallback, useRef } from "react";
import Card from "../components/Card";
import LineChartCard from "../components/LineChartCard";
import ProtocolChart from "../components/ProtocolChart";
import TopologyGraph from "../components/TopologyGraph";
import TopTalkers from "../components/TopTalkers";
import AlertDetails from "../components/AlertDetails";
import "./Dashboard.css";

/* ---------- Helpers ---------- */
function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return { value: 0, unit: "B" };
  if (bytes < 1024) return { value: bytes, unit: "B" };
  if (bytes < 1024 * 1024) return { value: +(bytes / 1024).toFixed(2), unit: "KB" };
  return { value: +(bytes / (1024 * 1024)).toFixed(2), unit: "MB" };
}

/* ---------- Dashboard ---------- */
export default function Dashboard() {
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [autoMode, setAutoMode] = useState(true);
  const mounted = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      const metricsRes = await fetch("http://127.0.0.1:8000/api/metrics/latest");
      const alertsRes = await fetch("http://127.0.0.1:8000/api/alerts");
      const protoRes = await fetch("http://127.0.0.1:8000/api/protocols");
      const topRes = await fetch("http://127.0.0.1:8000/api/top-talkers");
      const topoRes = await fetch("http://127.0.0.1:8000/api/topology");
      const detailsRes = await fetch("http://127.0.0.1:8000/api/alerts/details");

      const mData = metricsRes.ok ? await metricsRes.json() : [];
      const aData = alertsRes.ok ? await alertsRes.json() : [];
      const protoData = protoRes.ok ? await protoRes.json() : [];
      const topData = topRes.ok ? await topRes.json() : { src: [], dst: [] };
      const topoData = topoRes.ok ? await topoRes.json() : [];
      const detailsData = detailsRes.ok ? await detailsRes.json() : {};

      if (Array.isArray(mData) && mData.length > 0) {
        setMetrics((prev) => {
          const appended = [...prev, ...mData.map((x) => ({ ...x }))];
          return appended.slice(-120); // keep last 120 points
        });
      }
      setAlerts(Array.isArray(aData) ? aData : []);
      setProtocols(Array.isArray(protoData) ? protoData : []);
      setTopTalkers(topData);
      setTopology(topoData);
      setAlertDetails(detailsData);
    } catch (e) {
      // keep console error for debugging; production could surface a toast instead
      // eslint-disable-next-line no-console
      console.error("Fetch error:", e);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchAll();
    let id = null;
    if (autoMode) id = setInterval(fetchAll, 5000);
    return () => {
      mounted.current = false;
      if (id) clearInterval(id);
    };
  }, [autoMode, fetchAll]);

  // Prepare chart-friendly dataset; attach unit fields used by tooltip
  const chartData = metrics.map((m) => {
    const bytes = formatBytes(m.total_bytes);
    return {
      time: new Date(m.timestamp).toLocaleTimeString(),
      bytes: bytes.value,
      unit: bytes.unit,
      bytes_unit: bytes.unit,
      entropy: typeof m.dst_ip_entropy === "number" ? +m.dst_ip_entropy.toFixed(3) : 0,
      fanout: typeof m.avg_fan_out === "number" ? +m.avg_fan_out.toFixed(3) : 0,
      throughput: typeof m.throughput_mbps === "number" ? +m.throughput_mbps : 0,
    };
  });

  const latestTrafficUnit = chartData.length ? chartData[chartData.length - 1].bytes_unit : "B";

  const speedData = metrics.map((m) => ({ time: new Date(m.timestamp).toLocaleTimeString(), speed: m.throughput_mbps || 0 }));

  const [protocols, setProtocols] = React.useState([]);
  const [topTalkers, setTopTalkers] = React.useState({ src: [], dst: [] });
  const [topology, setTopology] = React.useState([]);
  const [alertDetailsState, setAlertDetails] = React.useState({});

  return (
    <div className="dashboard-container">
      <div className="header-row">
        <div>
          <div className="title">Network Observability Platform</div>
          <div className="meta">Operations Center — Live network telemetry</div>
        </div>

        <div className="controls">
          <div className="meta" style={{ marginRight: 8 }}>{`📊 Data points loaded: ${metrics.length}`}</div>
          <button className="btn btn-primary" onClick={fetchAll}>Run ML ▶</button>
          <button
            className={`btn ${autoMode ? "toggle-on" : "toggle-off"}`}
            onClick={() => setAutoMode((v) => !v)}
          >
            {autoMode ? "Auto ON" : "Auto OFF"}
          </button>
        </div>
      </div>

      <Card title={`📈 Network Traffic (${latestTrafficUnit})`}>
        <LineChartCard data={chartData} dataKey="bytes" unitKey="bytes_unit" yLabel={latestTrafficUnit} />
      </Card>

      <Card title={"🚀 Network Speed (MB/s)"}>
        <LineChartCard data={speedData} dataKey="speed" unitKey={null} yLabel="MB/s" stroke={require("../theme").default.primary} />
      </Card>

      <div className="grid-2">
        <Card title="📊 Destination IP Entropy">
          <LineChartCard data={chartData} dataKey="entropy" yLabel="Entropy" stroke={require("../theme").default.success} />
        </Card>

        <Card title="🔀 Average Fan-Out">
          <LineChartCard data={chartData} dataKey="fanout" yLabel="Fan-Out" stroke={require("../theme").default.warning} />
        </Card>
      </div>

      <div className="grid-2">
        <Card title="🥧 Protocol Distribution">
          <ProtocolChart data={protocols} />
        </Card>

        <Card title="🧾 Top Talkers">
          <TopTalkers data={topTalkers} />
        </Card>
      </div>

      <Card title="🌐 Network Topology">
        <TopologyGraph edges={topology} />
      </Card>

      <Card title="🚨 ML Alert Details">
        <AlertDetails details={alertDetailsState} />
      </Card>

      <div className="alerts-panel">
        <Card title="🚨 Live ML Alerts">
          {alerts.length === 0 ? (
            <div className="alert-empty">✔ No abnormal behavior detected</div>
          ) : (
            alerts.map((a, i) => (
              <div
                key={i}
                className={`alert ${
                  a.severity === "critical" ? "alert-critical" : a.severity === "high" ? "alert-high" : "alert-medium"
                }`}
              >
                <div style={{ fontWeight: 800, textTransform: "uppercase" }}>{a.severity}</div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>{a.reason}</div>
                <div style={{ marginTop: 6, opacity: 0.95 }}>{a.explanation}</div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
