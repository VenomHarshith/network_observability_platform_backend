import React, { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { getMetrics } from "../api";

export default function Settings() {
  const [status, setStatus] = useState({});

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    const m = await getMetrics();
    setStatus({ api: m ? "ok" : "down", last: (m && m.data && m.data.length) ? new Date(m.data[m.data.length-1].timestamp).toLocaleString() : "-" });
  }

  return (
    <Layout>
      <h2>Settings & Status</h2>
      <div className="card">
        <div><strong>Backend API:</strong> {status.api}</div>
        <div style={{ marginTop: 8 }}><strong>Last data point:</strong> {status.last}</div>
      </div>
    </Layout>
  );
}
