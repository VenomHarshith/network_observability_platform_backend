import React, { useEffect, useMemo, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import theme from "../theme";

export default function TopologyGraph({ edges = [], selectedNodeId = null, onNodeClick = () => {}, onNodeHover = () => {}, isFrozen = false, exposeRef = null, height = 480 }) {
  const fgRef = useRef();

  // build nodes and links and compute degrees/bytes
  const { nodes, links, degreeMap, bytesMap } = useMemo(() => {
    const nodesMap = {};
    const degree = {};
    const bytes = {};
    const ls = (edges || []).map((e) => {
      nodesMap[e.src_ip] = true;
      nodesMap[e.dst_ip] = true;
      degree[e.src_ip] = (degree[e.src_ip] || 0) + 1;
      degree[e.dst_ip] = (degree[e.dst_ip] || 0) + 1;
      bytes[e.src_ip] = (bytes[e.src_ip] || 0) + (e.bytes || 0);
      bytes[e.dst_ip] = (bytes[e.dst_ip] || 0) + (e.bytes || 0);
      return { source: e.src_ip, target: e.dst_ip, bytes: e.bytes };
    });
    const ns = Object.keys(nodesMap).map((id) => ({ id }));
    return { nodes: ns, links: ls, degreeMap: degree, bytesMap: bytes };
  }, [edges]);

  useEffect(() => {
    // attempt to zoomToFit after nodes update; guard against null ref
    setTimeout(() => {
      try {
        if (fgRef && fgRef.current && typeof fgRef.current.zoomToFit === "function") {
          fgRef.current.zoomToFit(400);
        }
      } catch (err) {
        // ignore failures
      }
    }, 500);
  }, [edges]);

  // expose the underlying force-graph instance to parent if requested
  useEffect(() => {
    if (exposeRef) {
      try { exposeRef.current = fgRef.current; } catch (e) { /* ignore */ }
    }
  }, [exposeRef]);

  // pause/resume rendering/sim when user freezes the view
  useEffect(() => {
    try {
      if (isFrozen) fgRef.current?.pauseAnimation?.();
      else fgRef.current?.resumeAnimation?.();
    } catch (err) {
      // ignore
    }
  }, [isFrozen]);

  const containerHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div style={{ width: "100%", height: containerHeight, overflow: "hidden" }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeLabel={(n) => `${n.id}\n${(bytesMap[n.id]||0)/1024 >> 0} KB`}
        onNodeClick={(node) => onNodeClick(node)}
        onNodeHover={(node) => onNodeHover(node)}
        linkDirectionalParticles={0}
        linkColor={() => 'rgba(15,23,42,0.10)'}
        linkWidth={(l) => Math.max(0.5, Math.min(3, Math.log10((l.bytes || 1) + 1)))}
        nodeAutoColorBy={(n) => (n.id === selectedNodeId ? "selected" : "default")}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.id;
          const g = globalScale || 1;
          const deg = Math.max(1, (degreeMap[node.id] || 1));
          const size = Math.min(12, 3 + Math.log10(deg + 1) * 4);

          // draw halo for selected
          if (node.id === selectedNodeId) {
            ctx.beginPath();
            ctx.fillStyle = "rgba(180,83,9,0.12)"; /* amber halo */
            ctx.arc(node.x, node.y, size + 8, 0, 2 * Math.PI, false);
            ctx.fill();
          }

          // node circle: neutral grey, selected amber/dark
          ctx.beginPath();
          ctx.fillStyle = node.id === selectedNodeId ? "#92400e" : "#374151";
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
          ctx.fill();

          // label: cap scaling to avoid massive labels when zooming out
          const fontSize = Math.max(10, Math.min(16, 14 / g));
          ctx.font = `${fontSize}px Inter, Sans-Serif`;
          const textWidth = ctx.measureText(label).width;

          // draw subtle background for label for readability
          ctx.fillStyle = 'rgba(255,255,255,0.90)';
          ctx.fillRect(node.x + size + 6 - 4, node.y - fontSize / 2 - 2, textWidth + 8, fontSize + 4);

          ctx.fillStyle = theme.heading || '#1e293b';
          ctx.fillText(label, node.x + size + 8, node.y + fontSize / 2 - 2);

          // draw a small badge with the node's connection count (degree)
          const count = degreeMap[node.id] || 0;
          if (count > 0) {
            const badgeRadius = Math.max(8, Math.min(12, 6 + Math.log10(count + 1) * 2));
            const bx = node.x - size - badgeRadius - 6;
            const by = node.y - badgeRadius - 6;

            // badge background
            ctx.beginPath();
            ctx.fillStyle = 'rgba(59,130,246,0.95)';
            ctx.arc(bx, by, badgeRadius, 0, Math.PI * 2);
            ctx.fill();

            // badge text
            ctx.fillStyle = '#fff';
            ctx.font = `${Math.max(10, badgeRadius - 2)}px Inter, Sans-Serif`;
            const txt = String(count);
            const tw = ctx.measureText(txt).width;
            ctx.fillText(txt, bx - tw / 2, by + (Math.max(10, badgeRadius - 2) / 2) - 2);
          }
        }}
      />
    </div>
  );
}
