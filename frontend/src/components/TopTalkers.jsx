import React, { useEffect, useState, useRef } from "react";
import "../pages/Dashboard.css";
import theme from "../theme";

/* ---------------- PTR LOOKUP ---------------- */

async function resolvePtr(ip) {

  try {

    const parts = ip.split(".");

    if (parts.length !== 4)
      return null;

    const rev =
      parts.reverse().join(".")
      + ".in-addr.arpa";

    const res = await fetch(
      `https://dns.google/resolve?name=${rev}&type=PTR`
    );

    if (!res.ok)
      return null;

    const j = await res.json();

    if (
      j &&
      Array.isArray(j.Answer) &&
      j.Answer.length
    ) {

      return j.Answer[0]
        .data
        .replace(/\.$/, "");

    }

    return null;

  } catch {

    return null;

  }

}

/* ---------------- COMPONENT ---------------- */

export default function TopTalkers({
  data = {
    src: [],
    dst: []
  }
}) {

  const [names, setNames] = useState({});

  const [tab, setTab] =
    useState("src");

  const cacheRef = useRef({});

  /* ---------------- DNS LOOKUPS ---------------- */

  useEffect(() => {

    let mounted = true;

    const ips = new Set();

    (data.src || []).forEach((r) =>
      ips.add(r.ip)
    );

    (data.dst || []).forEach((r) =>
      ips.add(r.ip)
    );

    const toResolve =
      Array.from(ips)
        .slice(0, 12)
        .filter(
          (ip) =>
            !cacheRef.current[ip]
        );

    if (toResolve.length === 0)
      return;

    (async () => {

      for (const ip of toResolve) {

        const name =
          await resolvePtr(ip);

        if (!mounted)
          return;

        cacheRef.current[ip] =
          name || null;

        setNames((s) => ({
          ...s,
          [ip]: name || null
        }));

      }

    })();

    return () => {

      mounted = false;

    };

  }, [data]);

  /* ---------------- ACTIVE TABLE ---------------- */

  const rows =
    tab === "src"
      ? data.src || []
      : data.dst || [];

  /* ---------------- UI ---------------- */

  return (

    <div
      style={{
        width: "100%"
      }}
    >

      {/* TABS */}
      <div
        style={{
          display: "flex",
          background: "#f1f5f9",
          padding: 4,
          borderRadius: 12,
          marginBottom: 18
        }}
      >

        <button
          onClick={() =>
            setTab("src")
          }
          style={{
            flex: 1,

            padding: "10px 0",

            border: "none",

            borderRadius: 10,

            cursor: "pointer",

            fontWeight: 700,

            transition: "0.2s",

            background:
              tab === "src"
                ? "#0f172a"
                : "transparent",

            color:
              tab === "src"
                ? "#fff"
                : "#0f172a"
          }}
        >
          Sources
        </button>

        <button
          onClick={() =>
            setTab("dst")
          }
          style={{
            flex: 1,

            padding: "10px 0",

            border: "none",

            borderRadius: 10,

            cursor: "pointer",

            fontWeight: 700,

            transition: "0.2s",

            background:
              tab === "dst"
                ? "#0f172a"
                : "transparent",

            color:
              tab === "dst"
                ? "#fff"
                : "#0f172a"
          }}
        >
          Destinations
        </button>

      </div>

      {/* TABLE */}
      <div
        style={{
          maxHeight: 360,
          overflowY: "auto",
          paddingRight: 4
        }}
      >

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse"
          }}
        >

          <thead>

            <tr>

              <th
                style={thStyle}
              >
                IP / Name
              </th>

              <th
                style={{
                  ...thStyle,
                  textAlign: "right"
                }}
              >
                Bytes
              </th>

            </tr>

          </thead>

          <tbody>

            {rows.map((r, i) => (

              <tr key={i}>

                <td
                  style={tdStyle}
                >

                  <div
                    style={{
                      fontWeight: 700,
                      color: theme.text,
                      marginBottom: 4
                    }}
                  >
                    {r.ip}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--label)",
                      wordBreak: "break-word"
                    }}
                  >
                    {names[r.ip] || ""}
                  </div>

                </td>

                <td
                  style={{
                    ...tdStyle,
                    textAlign: "right",
                    color: theme.muted,
                    fontWeight: 700
                  }}
                >
                  {formatBytes(r.bytes)}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

/* ---------------- HELPERS ---------------- */

export function formatBytes(b) {

  const n = Number(b) || 0;

  if (n < 1024)
    return `${n} B`;

  if (n < 1024 * 1024)
    return `${(n / 1024).toFixed(1)} KB`;

  return `${(n / (1024 * 1024)).toFixed(2)} MB`;

}

const thStyle = {

  paddingBottom: 14,

  fontSize: 13,

  color: "#64748b",

  borderBottom:
    "1px solid #e2e8f0"

};

const tdStyle = {

  padding: "14px 0",

  borderBottom:
    "1px solid #f1f5f9",

  verticalAlign: "top"

};