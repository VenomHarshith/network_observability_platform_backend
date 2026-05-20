import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Overview from "./pages/Overview";
import TrafficAnalysis from "./pages/TrafficAnalysis";
import FlowExplorer from "./pages/FlowExplorer";
import EntropyFanout from "./pages/EntropyFanout";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";

import { getMetrics } from "./api";
import { pushMetricsBatch } from "./stores/metricsStore";

function App() {
  // fetch an initial batch of metrics on app startup so pages show data immediately
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const m = await getMetrics();
        if (!mounted) return;
        if (m.data) pushMetricsBatch(m.data);
      } catch (e) {
        // ignore
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/traffic" element={<TrafficAnalysis />} />
        <Route path="/flows" element={<FlowExplorer />} />
        <Route path="/entropy" element={<EntropyFanout />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
