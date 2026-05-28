import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import Layout from "../layout/Layout";

import TopologyGraph from "../components/TopologyGraph";

import { formatBytes }
from "../components/TopTalkers";

import { getTopology }
from "../api";

export default function FlowExplorer() {

  const [edges, setEdges] = useState([]);

  const [isFrozen, setIsFrozen] = useState(false);

  const [selected, setSelected] = useState(null);

  const [showAllConnections, setShowAllConnections] =
    useState(false);

  const [query, setQuery] = useState("");

  const [talkerTab, setTalkerTab] =
    useState("src");

  const fgApi = useRef(null);

  useEffect(() => {

    setShowAllConnections(false);

  }, [selected]);

  useEffect(() => {

    if (isFrozen) return;

    fetchTopo();

    const id =
      setInterval(fetchTopo, 5000);

    return () => clearInterval(id);

  }, [isFrozen]);

  async function fetchTopo() {

    const t = await getTopology();

    setEdges(t || []);

  }

  /* ---------------- TOP TALKERS ---------------- */

  const {
    aggregatedSrc,
    aggregatedDst
  } = useMemo(() => {

    const srcMap = {};

    const dstMap = {};

    (edges || []).forEach((e) => {

      srcMap[e.src_ip] =
        (srcMap[e.src_ip] || 0)
        + (e.bytes || 0);

      dstMap[e.dst_ip] =
        (dstMap[e.dst_ip] || 0)
        + (e.bytes || 0);

    });

    const src =
      Object.entries(srcMap)
        .map(([id, bytes]) => ({
          id,
          bytes
        }))
        .sort((a, b) =>
          b.bytes - a.bytes
        );

    const dst =
      Object.entries(dstMap)
        .map(([id, bytes]) => ({
          id,
          bytes
        }))
        .sort((a, b) =>
          b.bytes - a.bytes
        );

    return {
      aggregatedSrc: src,
      aggregatedDst: dst
    };

  }, [edges]);

  /* ---------------- FILTERS ---------------- */

  const filteredSrc = useMemo(() => {

    if (!query) return aggregatedSrc;

    const q = query.trim();

    return aggregatedSrc.filter((a) =>
      a.id.includes(q)
    );

  }, [aggregatedSrc, query]);

  const filteredDst = useMemo(() => {

    if (!query) return aggregatedDst;

    const q = query.trim();

    return aggregatedDst.filter((a) =>
      a.id.includes(q)
    );

  }, [aggregatedDst, query]);

  return (

    <Layout fullWindow>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}
      >

        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",

            marginBottom: 24,

            gap: 16,

            flexWrap: "wrap"
          }}
        >

          <div>

            <h2
              style={{
                marginBottom: 8
              }}
            >
              Flow Explorer
            </h2>

            <div
              style={{
                color: "#64748b",
                fontSize: 14
              }}
            >
              Live topology and traffic relationships
            </div>

          </div>

          {/* CONTROLS */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center"
            }}
          >

            <input
              placeholder="Search IP address..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              style={{
                padding: "12px 14px",

                borderRadius: 14,

                border:
                  "1px solid rgba(15,23,42,0.08)",

                background:
                  "rgba(255,255,255,0.8)",

                minWidth: 220,

                outline: "none",

                fontSize: 14
              }}
            />

            <button
              className="btn btn-primary"
              onClick={() =>
                setIsFrozen((f) => !f)
              }
            >
              {isFrozen
                ? "Unfreeze"
                : "Freeze"}
            </button>

          </div>

        </div>

        {/* MAIN */}
        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "1fr 360px",

            gap: 22,

            flex: 1,

            minHeight: 0
          }}
        >

          {/* GRAPH */}
          <div
            className="card"
            style={{
              padding: 0,

              overflow: "hidden",

              display: "flex",

              flexDirection: "column"
            }}
          >

            {/* GRAPH HEADER */}
            <div
              style={{
                padding:
                  "18px 22px",

                borderBottom:
                  "1px solid rgba(15,23,42,0.05)",

                display: "flex",

                justifyContent:
                  "space-between",

                alignItems: "center"
              }}
            >

              <div>

                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 18
                  }}
                >
                  Network Graph
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 13,
                    marginTop: 4
                  }}
                >
                  Interactive realtime topology
                </div>

              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,

                  fontSize: 13,
                  color: "#64748b"
                }}
              >

                <span
                  style={{
                    width: 10,
                    height: 10,

                    borderRadius: "50%",

                    background:
                      isFrozen
                        ? "#f59e0b"
                        : "#10b981",

                    boxShadow:
                      isFrozen
                        ? "0 0 12px rgba(245,158,11,0.5)"
                        : "0 0 12px rgba(16,185,129,0.5)"
                  }}
                />

                {isFrozen
                  ? "Paused"
                  : "Live"}

              </div>

            </div>

            {/* GRAPH */}
            <div
              style={{
                flex: 1,
                minHeight: 700
              }}
            >

              <TopologyGraph
                edges={edges}
                selectedNodeId={selected?.id}
                onNodeClick={(n) =>
                  setSelected(n)
                }
                isFrozen={isFrozen}
                exposeRef={fgApi}
                height={`100%`}
              />

            </div>

          </div>

          {/* RIGHT PANEL */}
          <div
            style={{
              display: "flex",

              flexDirection: "column",

              gap: 18
            }}
          >

            {/* TALKERS */}
            <div
              className="card"
              style={{
                flex: 1,

                overflow: "hidden",

                display: "flex",

                flexDirection: "column"
              }}
            >

              <div
                style={{
                  display: "flex",

                  justifyContent:
                    "space-between",

                  alignItems: "center",

                  marginBottom: 18
                }}
              >

                <div>

                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 17
                    }}
                  >
                    Top Talkers
                  </div>

                  <div
                    style={{
                      color: "#64748b",
                      fontSize: 13,
                      marginTop: 4
                    }}
                  >
                    Highest traffic contributors
                  </div>

                </div>

                {/* TABS */}
                <div
                  style={{
                    display: "flex",

                    background:
                      "#f1f5f9",

                    borderRadius: 12,

                    padding: 4,

                    gap: 4
                  }}
                >

                  {["src", "dst"].map((tab) => (

                    <button
                      key={tab}
                      onClick={() =>
                        setTalkerTab(tab)
                      }
                      style={{
                        border: "none",

                        padding:
                          "7px 14px",

                        borderRadius: 10,

                        cursor: "pointer",

                        fontWeight: 700,

                        fontSize: 13,

                        transition:
                          "0.2s ease",

                        background:
                          talkerTab === tab
                            ? "#0f172a"
                            : "transparent",

                        color:
                          talkerTab === tab
                            ? "white"
                            : "#0f172a"
                      }}
                    >
                      {tab === "src"
                        ? "Sources"
                        : "Destinations"}
                    </button>

                  ))}

                </div>

              </div>

              {/* LIST */}
              <div
                style={{
                  overflowY: "auto",

                  display: "flex",

                  flexDirection: "column",

                  gap: 10,

                  paddingRight: 4
                }}
              >

                {(talkerTab === "src"
                  ? filteredSrc
                  : filteredDst
                )
                  .slice(0, 15)
                  .map((t, i) => (

                    <div
                      key={i}
                      style={{

                        display: "flex",

                        justifyContent:
                          "space-between",

                        alignItems: "center",

                        padding:
                          "12px 14px",

                        borderRadius: 14,

                        background:
                          "rgba(248,250,252,0.8)",

                        border:
                          "1px solid rgba(15,23,42,0.04)"
                      }}
                    >

                      <div
                        style={{
                          fontWeight: 700,

                          fontSize: 13,

                          maxWidth: 190,

                          wordBreak:
                            "break-word"
                        }}
                      >
                        {t.id}
                      </div>

                      <div
                        style={{
                          fontWeight: 800,

                          color: "#0f172a",

                          fontSize: 13
                        }}
                      >
                        {formatBytes(t.bytes)}
                      </div>

                    </div>

                  ))}

              </div>

            </div>

            {/* DETAILS */}
            <div
              className="card"
              style={{
                flex: 1
              }}
            >

              <div
                style={{
                  marginBottom: 18
                }}
              >

                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 17
                  }}
                >
                  Node Details
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 13,
                    marginTop: 4
                  }}
                >
                  Selected node insights
                </div>

              </div>

              {selected ? (

                <div>

                  <div
                    style={{
                      color: "#64748b",

                      fontSize: 12,

                      marginBottom: 8
                    }}
                  >
                    SELECTED IP
                  </div>

                  <div
                    style={{
                      fontWeight: 800,

                      fontSize: 18,

                      marginBottom: 20,

                      wordBreak:
                        "break-word"
                    }}
                  >
                    {selected.id}
                  </div>

                  <div
                    style={{
                      color: "#64748b",

                      fontSize: 12,

                      marginBottom: 10
                    }}
                  >
                    CONNECTIONS
                  </div>

                  <div
                    style={{
                      maxHeight: 280,

                      overflowY: "auto"
                    }}
                  >

                    {(edges || [])
                      .filter((e) =>
                        e.src_ip === selected.id ||
                        e.dst_ip === selected.id
                      )
                      .slice(
                        0,
                        showAllConnections
                          ? 1000
                          : 8
                      )
                      .map((e, i) => (

                        <div
                          key={i}
                          style={{
                            padding:
                              "10px 12px",

                            borderRadius: 14,

                            background:
                              "rgba(248,250,252,0.85)",

                            marginBottom: 10,

                            border:
                              "1px solid rgba(15,23,42,0.05)"
                          }}
                        >

                          <div
                            style={{
                              fontSize: 13,

                              fontWeight: 700,

                              marginBottom: 6,

                              wordBreak:
                                "break-word"
                            }}
                          >
                            {e.src_ip}
                            {" → "}
                            {e.dst_ip}
                          </div>

                          <div
                            style={{
                              fontSize: 12,

                              color:
                                "#64748b"
                            }}
                          >
                            {formatBytes(e.bytes)}
                          </div>

                        </div>

                      ))}

                  </div>

                </div>

              ) : (

                <div
                  style={{
                    color: "#64748b",

                    lineHeight: 1.6
                  }}
                >
                  Select a node from the graph
                  to inspect traffic relationships
                  and active connections.
                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </Layout>

  );

}