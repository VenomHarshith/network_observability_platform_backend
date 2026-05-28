import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";

import theme from "../theme";

const COLORS = [
  theme.primary,
  theme.success,
  theme.danger,
  "#f472b6",
  "#a78bfa",
  theme.warning
];

export default function ProtocolChart({ data = [] }) {

  const pieData = (data || []).map((d) => ({
    name: d.protocol,
    value: d.bytes
  }));

  const total = pieData.reduce(
    (s, p) => s + (p.value || 0),
    0
  );

  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name
  }) => {

    const RADIAN = Math.PI / 180;

    const radius =
      innerRadius + (outerRadius - innerRadius) * 0.6;

    const x =
      cx + radius * Math.cos(-midAngle * RADIAN);

    const y =
      cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        style={{
          fontSize: 12,
          fontWeight: 700
        }}
      >
        {`${name} ${Math.round(percent * 100)}%`}
      </text>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >

      {/* LEGEND */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 10
        }}
      >
        {pieData.map((entry, idx) => {

          const pct = total
            ? Math.round((entry.value / total) * 100)
            : 0;

          return (
            <div
              key={entry.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 12,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                minWidth: 120
              }}
            >

              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background:
                    COLORS[idx % COLORS.length]
                }}
              />

              <div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0f172a"
                  }}
                >
                  {entry.name}

                  <span
                    style={{
                      marginLeft: 6,
                      color: "#64748b",
                      fontWeight: 600
                    }}
                  >
                    {pct}%
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#94a3b8"
                  }}
                >
                  {(entry.value / (1024 * 1024)).toFixed(2)} MB
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* CHART */}
      <div
        style={{
          flex: 1,
          minHeight: 240,
          position: "relative"
        }}
      >

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <PieChart>

            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
              label={renderLabel}
              labelLine={false}
            >

              {pieData.map((entry, idx) => (
                <Cell
                  key={`c-${idx}`}
                  fill={
                    COLORS[idx % COLORS.length]
                  }
                />
              ))}

            </Pie>

            <Tooltip
              formatter={(v) =>
                `${(
                  v / (1024 * 1024)
                ).toFixed(2)} MB`
              }
            />

          </PieChart>

        </ResponsiveContainer>

        {/* CENTER BADGE */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none"
          }}
        >

          <div
            style={{
              background:
                "rgba(15,23,42,0.88)",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 14,
              textAlign: "center"
            }}
          >

            <div
              style={{
                fontSize: 22,
                fontWeight: 800
              }}
            >
              {(total / (1024 * 1024)).toFixed(2)} MB
            </div>

            <div
              style={{
                fontSize: 12,
                opacity: 0.75
              }}
            >
              Total Traffic
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}