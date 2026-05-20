import React, { useEffect, useState, useRef } from "react";
import "../pages/Dashboard.css";
import theme from "../theme";

// Best-effort reverse DNS via Google's DNS-over-HTTPS
async function resolvePtr(ip) {
  try {
    // only handle IPv4 here
    const parts = ip.split(".");
    if (parts.length !== 4) return null;
    const rev = parts.reverse().join(".") + ".in-addr.arpa";
    const res = await fetch(`https://dns.google/resolve?name=${rev}&type=PTR`);
    if (!res.ok) return null;
    const j = await res.json();
    if (j && Array.isArray(j.Answer) && j.Answer.length) {
      // take first answer and strip trailing dot
      return j.Answer[0].data.replace(/\.$/, "");
    }
    return null;
  } catch (e) {
    return null;
  }
}

export default function TopTalkers({ data = { src: [], dst: [] } }) {
  const [names, setNames] = useState({});
  const cacheRef = useRef({});

  useEffect(() => {
    let mounted = true;
    const ips = new Set();
    (data.src || []).forEach((r) => ips.add(r.ip));
    (data.dst || []).forEach((r) => ips.add(r.ip));

    // resolve up to 12 IPs to avoid excessive lookups
    const toResolve = Array.from(ips).slice(0, 12).filter((ip) => !cacheRef.current[ip]);
    if (toResolve.length === 0) return;

    (async () => {
      for (const ip of toResolve) {
        const name = await resolvePtr(ip);
        if (!mounted) return;
        cacheRef.current[ip] = name || null;
        setNames((s) => ({ ...s, [ip]: name || null }));
      }
    })();

    return () => { mounted = false; };
  }, [data]);

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: "6px 0 8px", color: theme.text }}>Top Sources</h4>
        <table style={{ width: "100%" }}>
          <thead>
            <tr><th>IP / Name</th><th style={{ textAlign: "right" }}>Bytes</th></tr>
          </thead>
          <tbody>
            {data.src.map((r, i) => (
              <tr key={i}>
                <td style={{ color: theme.text }}>
                  <div style={{ fontWeight: 700 }}>{r.ip}</div>
                  <div style={{ fontSize: 12, color: "var(--label)" }}>{names[r.ip] || ""}</div>
                </td>
                <td style={{ textAlign: "right", color: theme.muted }}>{formatBytes(r.bytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ margin: "6px 0 8px", color: theme.text }}>Top Destinations</h4>
        <table style={{ width: "100%" }}>
          <thead>
            <tr><th>IP / Name</th><th style={{ textAlign: "right" }}>Bytes</th></tr>
          </thead>
          <tbody>
            {data.dst.map((r, i) => (
              <tr key={i}>
                <td style={{ color: theme.text }}>
                  <div style={{ fontWeight: 700 }}>{r.ip}</div>
                  <div style={{ fontSize: 12, color: "var(--label)" }}>{names[r.ip] || ""}</div>
                </td>
                <td style={{ textAlign: "right", color: theme.muted }}>{formatBytes(r.bytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function formatBytes(b) {
  const n = Number(b) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
