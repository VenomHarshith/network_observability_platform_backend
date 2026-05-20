import React from "react";
import "../pages/Dashboard.css";
import theme from "../theme";

export default function AlertDetails({ details = {} }) {
  const { metrics = {}, top_talkers = {}, explanations = [] } = details;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: theme.muted, fontSize: 12 }}>Latest Metrics</div>
          <div style={{ fontWeight: 700, marginTop: 6, color: theme.text }}>
            Throughput: {metrics.throughput_mbps ?? "-"} MB/s
          </div>
          <div style={{ marginTop: 6, color: theme.text }}>Entropy: {metrics.dst_ip_entropy ?? "-"}</div>
          <div style={{ marginTop: 6, color: theme.text }}>Avg Fan-Out: {metrics.avg_fan_out ?? "-"}</div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: theme.muted, fontSize: 12 }}>Top Talkers</div>
          <div style={{ marginTop: 6 }}>
            {top_talkers.src && top_talkers.src.length > 0 ? (
              top_talkers.src.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: theme.text }}>{s.ip} — {(s.bytes/1024).toFixed(1)} KB</div>
              ))
            ) : (
              <div style={{ color: theme.muted }}>—</div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div style={{ color: theme.muted, fontSize: 12 }}>Why triggered</div>
        <ul style={{ marginTop: 8, color: theme.text }}>
          {explanations && explanations.length > 0 ? (
            explanations.map((e, i) => <li key={i}>{e}</li>)
          ) : (
            <li>No strong indicators detected.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

