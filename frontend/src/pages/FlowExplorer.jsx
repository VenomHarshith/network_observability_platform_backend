import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../layout/Layout";
import TopologyGraph from "../components/TopologyGraph";
import TopTalkers, { formatBytes } from "../components/TopTalkers";
import { getTopology } from "../api";

export default function FlowExplorer() {
  const [edges, setEdges] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [query, setQuery] = useState("");
  const fgApi = useRef(null);

  useEffect(() => {
    setShowAllConnections(false);
  }, [selected]);

  useEffect(() => {
    if (isFrozen) return;

    // fetch immediately then poll while not frozen
    fetchTopo();
    const id = setInterval(fetchTopo, 5000);
    return () => clearInterval(id);
  }, [isFrozen]);

  async function fetchTopo() {
    const t = await getTopology();
    setEdges(t || []);
  }

  // derive top talkers separately for sources and destinations
  const { aggregatedSrc, aggregatedDst } = useMemo(() => {
    const srcMap = {};
    const dstMap = {};
    (edges || []).forEach((e) => {
      srcMap[e.src_ip] = (srcMap[e.src_ip] || 0) + (e.bytes || 0);
      dstMap[e.dst_ip] = (dstMap[e.dst_ip] || 0) + (e.bytes || 0);
    });
    const src = Object.entries(srcMap).map(([id, bytes]) => ({ id, bytes })).sort((a, b) => b.bytes - a.bytes);
    const dst = Object.entries(dstMap).map(([id, bytes]) => ({ id, bytes })).sort((a, b) => b.bytes - a.bytes);
    return { aggregatedSrc: src, aggregatedDst: dst };
  }, [edges]);

  const filteredSrc = useMemo(() => {
    if (!query) return aggregatedSrc;
    const q = query.trim();
    return aggregatedSrc.filter((a) => a.id.includes(q));
  }, [aggregatedSrc, query]);

  const filteredDst = useMemo(() => {
    if (!query) return aggregatedDst;
    const q = query.trim();
    return aggregatedDst.filter((a) => a.id.includes(q));
  }, [aggregatedDst, query]);

  return (
    <Layout fullWindow>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 24, boxSizing: 'border-box', height: 64 }}>
          <h2 style={{ margin: 0 }}>Flow Explorer</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              placeholder="Search IP..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.08)" }}
            />
            <button onClick={() => setIsFrozen((f) => !f)} style={{ padding: "6px 10px", cursor: "pointer" }}>
              {isFrozen ? "Unfreeze" : "Freeze"}
            </button>
          </div>
        </div>

        {/* Main two-column layout: graph on left, controls + top talkers on right */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'stretch', flex: 1, overflow: 'hidden', padding: 24, boxSizing: 'border-box' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: 12, borderBottom: '1px solid rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>Flow Graph</div>
                <div>
                  <button onClick={() => setIsFrozen((f) => !f)} style={{ padding: "6px 10px", cursor: "pointer" }}>
                    {isFrozen ? "Unfreeze" : "Freeze"}
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0 }}>
                <TopologyGraph
                  edges={edges}
                  selectedNodeId={selected?.id}
                  onNodeClick={(n) => setSelected(n)}
                  onNodeHover={(n) => {/* keep for future use */}}
                  isFrozen={isFrozen}
                  exposeRef={fgApi}
                  height={`100%`}
                />
              </div>
            </div>
          </div>

          <aside style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, height: '100%' }}>
            <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', height: '60%' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Top Talkers</div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <TopTalkers data={{ src: filteredSrc.slice(0, 12).map(t => ({ ip: t.id, bytes: t.bytes })), dst: filteredDst.slice(0, 12).map(t => ({ ip: t.id, bytes: t.bytes })) }} />
              </div>
            </div>

            <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', height: '40%' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Details</div>
              <div style={{ minHeight: 80, overflow: 'hidden', flex: 1 }}>
                {selected ? (
                  <div>
                    <div style={{ color: "var(--label)", marginBottom: 6 }}>IP</div>
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>{selected.id}</div>
                    <div style={{ color: "var(--label)", marginBottom: 6 }}>Connections</div>
                    <div style={{ marginBottom: 8, overflow: 'auto' }}>
                      {(edges || []).filter((e) => e.src_ip === selected.id || e.dst_ip === selected.id).slice(0, showAllConnections ? 1000 : 8).map((e, i) => (
                        <div key={i} style={{ padding: "6px 8px", borderRadius: 8, background: "#fbfcfe", marginBottom: 6 }}>
                          <div style={{ fontSize: 13 }}>{e.src_ip} → {e.dst_ip}</div>
                          <div style={{ fontSize: 12, color: "var(--label)" }}>{formatBytes(e.bytes)}</div>
                        </div>
                      ))}

                      {(edges || []).filter((e) => e.src_ip === selected.id || e.dst_ip === selected.id).length > 8 && (
                        <div style={{ marginTop: 8 }}>
                          <button onClick={() => setShowAllConnections((s) => !s)} style={{ padding: "6px 8px", cursor: 'pointer' }}>
                            {showAllConnections ? 'Show less' : 'Show all connections'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "var(--label)" }}>Select a node to see details.</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
