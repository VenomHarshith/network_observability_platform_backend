import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import "../pages/Dashboard.css";
import theme from "../theme";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  const value = payload[0].value;
  const unit = p && p.unit ? p.unit : p && p.bytes_unit ? p.bytes_unit : "";
  return (
    <div className="tooltip">
      <div className="tooltip-time">{label}</div>
      <div className="tooltip-value">{`${value} ${unit}`}</div>
    </div>
  );
}

export default function LineChartCard({
  title,
  data,
  dataKey,
  unitKey = null,
  stroke = theme.primary,
  yLabel = "",
}) {
  // Ensure each payload item exposes a `unit` key for tooltip; map fallback handled in CustomTooltip
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h4>{title}</h4>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" tick={{ fill: "#475569" }} />
            <YAxis
              tick={{ fill: "#475569" }}
              label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#475569" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
