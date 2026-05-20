import React from "react";
import Sidebar from "../components/Sidebar";
import "../pages/Dashboard.css";

export default function Layout({ children, fullWindow = false }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          padding: fullWindow ? 0 : 24,
          height: fullWindow ? "100vh" : undefined,
          overflow: fullWindow ? "hidden" : undefined,
        }}
      >
        {children}
      </main>
    </div>
  );
}
