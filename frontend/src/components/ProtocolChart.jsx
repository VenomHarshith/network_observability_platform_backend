import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import theme from "../theme";

const COLORS = [theme.primary, theme.success, theme.danger, "#f472b6", "#a78bfa", theme.warning];

export default function ProtocolChart({ data = [] }) {
  const pieData = (data || []).map((d) => ({ name: d.protocol, value: d.bytes }));
  const total = pieData.reduce((s, p) => s + (p.value || 0), 0);

  const legendPayload = pieData.map((entry, idx) => ({
    value: `${entry.name} ${total ? Math.round((entry.value / total) * 100) : 0}%`,
    type: "circle",
    color: COLORS[idx % COLORS.length],
    id: entry.name,
  }));

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    let x = cx + radius * Math.cos(-midAngle * RADIAN);
    let y = cy + radius * Math.sin(-midAngle * RADIAN);
    const text = `${name} ${Math.round(percent * 100)}%`;

    // clamp labels within the pie bounding box to avoid overflow
    const padding = 8;
    const maxX = cx + outerRadius - padding;
    const minX = cx - outerRadius + padding;
    const maxY = cy + outerRadius - padding;
    const minY = cy - outerRadius + padding;
    if (x > maxX) x = maxX;
    if (x < minX) x = minX;
    if (y > maxY) y = maxY;
    if (y < minY) y = minY;

    return (
      <text
        x={x}
        y={y}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        style={{ fontSize: 12, fontWeight: 700 }}
        fill="#ffffff"
        stroke="#000"
        strokeWidth={0.6}
        strokeOpacity={0.25}
      >
        {text}
      </text>
    );
  };

  return (
    <div style={{ width: "100%", height: 340, padding: 8, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Protocol Distribution (%)</h3>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 44, bottom: 40, overflow: "hidden" }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={4}
              label={renderLabel}
              labelLine={{ stroke: '#ffffff', strokeWidth: 1, strokeOpacity: 0.6 }}
            >
              {pieData.map((entry, idx) => (
                <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip formatter={(v) => `${(v / (1024 * 1024)).toFixed(2)} MB`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* explicit legend below chart for clear mapping of colors -> protocol */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        {pieData.map((entry, idx) => {
          const pct = total ? Math.round((entry.value / total) * 100) : 0;
          return (
            <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "#fff", boxShadow: "0 4px 12px rgba(15,23,42,0.04)", minWidth: 140 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[idx % COLORS.length], boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{entry.name} <span style={{ color: "var(--label)", fontWeight: 600, marginLeft: 6 }}>{pct}%</span></div>
                <div style={{ fontSize: 12, color: "var(--label)" }}>{`${(entry.value / (1024 * 1024)).toFixed(2)} MB`}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* center total badge for quick understanding */}
      <div style={{ position: "absolute", left: 0, right: 0, top: "44%", display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ background: "rgba(0,0,0,0.65)", color: "#fff", padding: "6px 10px", borderRadius: 10, fontWeight: 700 }}>
          {`${(total / (1024 * 1024)).toFixed(2)} MB`} <span style={{ fontWeight: 400, marginLeft: 6 }}>Total</span>
        </div>
      </div>
    </div>
  );
}
