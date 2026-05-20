import React from "react";
import { NavLink } from "react-router-dom";
import "../pages/Dashboard.css";

export default function Sidebar() {
  const links = [
    { to: "/", label: "Overview" },
    { to: "/traffic", label: "Traffic Analysis" },
    { to: "/flows", label: "Flow Explorer" },
    { to: "/entropy", label: "Entropy & Fan-Out" },
    { to: "/alerts", label: "Alerts" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">NOP — Observability</div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
