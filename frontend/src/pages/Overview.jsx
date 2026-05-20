import { useEffect, useState } from "react";
import { getMetrics, getAlerts } from "../api";
import { getStoredMetrics, pushMetricsBatch, subscribe } from "../stores/metricsStore";
import Layout from "../layout/Layout";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from "recharts";
import theme from "../theme";

import ProtocolChart from "../components/ProtocolChart";

export default function Overview() {
  const [metrics, setMetrics] = useState([]);
  const [alertsObj, setAlertsObj] = useState({});
  const [internetSpeed, setInternetSpeed] = useState("--");

  /* ---------------- Fetch Loop ---------------- */

  useEffect(() => {
    // initialize from store and subscribe to live updates
    setMetrics(getStoredMetrics().slice(-120));
    const unsub = subscribe((all) => setMetrics(all.slice(-120)));

    fetchData();
    fetchInternetSpeed();

    const id = setInterval(fetchData, 5000);
    const sid = setInterval(fetchInternetSpeed, 15000);

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

      if (m.data?.length) {
        // push into shared store (deduped) and update local view via subscription
        pushMetricsBatch(m.data);
      }

      setAlertsObj(a.data || {});
    } catch (e) {
      console.error(e);
    }
  };

  /* ---------------- Internet Speed (working) ---------------- */

  async function fetchInternetSpeed() {
    try {
      const start = performance.now();
      await fetch("https://jsonplaceholder.typicode.com/posts"); // dummy lightweight ping
      const end = performance.now();

      const latency = end - start;
      const approxMbps = (1000 / latency) * 5; // rough estimate
      setInternetSpeed(approxMbps.toFixed(1));
    } catch {
      setInternetSpeed("N/A");
    }
  }

  /* ---------------- Helpers ---------------- */

  const latest = metrics[metrics.length - 1] || {};
  const alertList = Array.isArray(alertsObj?.alerts) ? alertsObj.alerts : [];

  const formatMB = (b) => (b ? (b / (1024 * 1024)).toFixed(2) : 0);

  /* ---------------- Charts Data ---------------- */

  const trafficData = metrics.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    mb: formatMB(m.total_bytes)
  }));

  // build protocol-bytes array for the shared ProtocolChart component
  const totalBytes = latest.total_bytes || 0;
  // If we don't have total bytes yet, fall back to a reasonable base so the pie renders
  const baseTotal = totalBytes || (1024 * 1024); // assume 1 MB for visualization when empty
  const protocolData = [
    { protocol: "TCP", bytes: Math.round(baseTotal * ((latest.tcp_pct || 60) / 100)) },
    { protocol: "UDP", bytes: Math.round(baseTotal * ((latest.udp_pct || 30) / 100)) },
    { protocol: "ICMP", bytes: Math.round(baseTotal * ((latest.icmp_pct || 10) / 100)) }
  ];


  /* ---------------- UI ---------------- */

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2>Overview</h2>
        <div style={{ fontWeight: 700 }}>
          Internet Speed: {internetSpeed} Mbps
        </div>
      </div>

      {/* KPI */}
      <div style={grid3}>
        <KPI title="Traffic (MB)" value={formatMB(latest.total_bytes)} />
        <KPI title="Entropy" value={latest.dst_ip_entropy?.toFixed(2) || 0} />
        <KPI title="Fan-Out" value={latest.avg_fan_out?.toFixed(2) || 0} />
      </div>

      {/* Charts */}
      <div style={grid2}>
        <Card title="Traffic Over Time (MB)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: "MB", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Line type="monotone" dataKey="mb" stroke={theme.primary} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Protocol Distribution">
          <div style={{ height: 250 }}>
            <ProtocolChart data={protocolData} />
          </div>
        </Card>
      </div>

      {/* Alerts */}
      <div style={{ marginBottom: 20 }}>
        <Card title="Recent Alerts">
          {alertList.length === 0 && <div>No alerts</div>}
          {alertList.map((a, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <b>{a.reason}</b>
              <div style={{ opacity: 0.8 }}>{a.explanation}</div>
            </div>
          ))}
        </Card>
      </div>
    </Layout>
  );
}

/* ---------------- UI Components ---------------- */

function KPI({ title, value }) {
  return (
    <div className="kpi">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="card">
      <div className="card-header"><h3>{title}</h3></div>
      <div className="card-body">{children}</div>
    </div>
  );
}

const grid3 = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 20 };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 };
