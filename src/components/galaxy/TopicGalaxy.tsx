"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import type { GalaxyData, GalaxyNode } from "@/lib/types";
import { lifecycleColor, formatNumber } from "@/lib/utils";

interface TopicGalaxyProps {
  data: GalaxyData;
}

interface SimNode extends GalaxyNode, d3.SimulationNodeDatum {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  weight: number;
  type: string;
}

function findNodeAt(
  nodes: SimNode[],
  x: number,
  y: number
): SimNode | null {
  let found: SimNode | null = null;
  let closestDist = Infinity;

  for (const node of nodes) {
    if (node.x == null || node.y == null) continue;
    const radius = Math.max(8, Math.min(28, 8 + node.mention_count / 5));
    const dist = Math.hypot(node.x - x, node.y - y);
    if (dist < radius + 8 && dist < closestDist) {
      closestDist = dist;
      found = node;
    }
  }

  return found;
}

export function TopicGalaxy({ data }: TopicGalaxyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNode, setActiveNode] = useState<GalaxyNode | null>(null);

  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const hoveredIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const drawRef = useRef<() => void>(() => {});

  const screenToGraph = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    return {
      x: (clientX - rect.left - t.x) / t.k,
      y: (clientY - rect.top - t.y) / t.k,
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !data.nodes.length) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current();
    };

    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = data.edges
      .filter((e) => nodeMap.has(e.source as string) && nodeMap.has(e.target as string))
      .map((e) => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        type: e.type,
      }));

    nodesRef.current = nodes;
    linksRef.current = links;
    hoveredIdRef.current = null;
    selectedIdRef.current = null;

    const { width, height } = container.getBoundingClientRect();

    const draw = () => {
      const { width: w, height: h } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);

      for (const link of links) {
        const s = link.source as SimNode;
        const t = link.target as SimNode;
        if (s.x == null || s.y == null || t.x == null || t.y == null) continue;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = `rgba(34, 211, 238, ${link.weight * 0.4})`;
        ctx.lineWidth = link.weight * 2;
        ctx.stroke();
      }

      for (const node of nodes) {
        if (node.x == null || node.y == null) continue;
        const radius = Math.max(8, Math.min(28, 8 + node.mention_count / 5));
        const isHovered = hoveredIdRef.current === node.id;
        const isSelected = selectedIdRef.current === node.id;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = lifecycleColor(node.lifecycle) + (isHovered || isSelected ? "ff" : "99");
        ctx.fill();

        if (isHovered || isSelected) {
          ctx.strokeStyle = lifecycleColor(node.lifecycle);
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = "#e2e8f0";
        ctx.font = `${isHovered || isSelected ? "12px" : "10px"} "Geist Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + radius + 14);
      }

      ctx.restore();
    };

    drawRef.current = draw;
    resize();

    simRef.current = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(120)
          .strength((d) => d.weight * 0.6)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(35))
      .on("tick", draw);

    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 5])
      .filter((event) => {
        // Allow zoom/pan on wheel and middle-click; left-drag only when not over a node
        if (event.type === "wheel") return true;
        if (event.button === 1) return true;
        if (event.type === "mousedown" && event.button === 0) {
          const { x, y } = screenToGraph(event.clientX, event.clientY);
          return findNodeAt(nodes, x, y) === null;
        }
        return false;
      })
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        draw();
      });

    d3.select(canvas).call(zoom);

    const updateHover = (clientX: number, clientY: number) => {
      const { x, y } = screenToGraph(clientX, clientY);
      const found = findNodeAt(nodes, x, y);
      const newId = found?.id ?? null;

      if (newId !== hoveredIdRef.current) {
        hoveredIdRef.current = newId;
        draw();
        const selected = selectedIdRef.current
          ? nodes.find((n) => n.id === selectedIdRef.current) ?? null
          : null;
        setActiveNode(selected ?? found);
      }

      canvas.style.cursor = found ? "pointer" : "grab";
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateHover(event.clientX, event.clientY);
    };

    const handleClick = (event: MouseEvent) => {
      const { x, y } = screenToGraph(event.clientX, event.clientY);
      const found = findNodeAt(nodes, x, y);
      selectedIdRef.current = found?.id ?? null;
      draw();
      setActiveNode(found);
    };

    const handlePointerLeave = () => {
      if (selectedIdRef.current) return;
      hoveredIdRef.current = null;
      draw();
      setActiveNode(null);
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", resize);

    return () => {
      simRef.current?.stop();
      d3.select(canvas).on(".zoom", null);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", resize);
    };
  }, [data, screenToGraph]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full touch-none" />

      {activeNode && (
        <div className="pointer-events-none absolute right-4 top-4 w-64 rounded-lg border border-border bg-surface/95 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: lifecycleColor(activeNode.lifecycle) }}
            />
            <h3 className="font-semibold text-foreground">{activeNode.label}</h3>
          </div>
          <p className="mt-1 text-xs capitalize text-muted">{activeNode.lifecycle}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted">Velocity</p>
              <p className="font-mono text-accent">{activeNode.velocity.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-muted">Mentions</p>
              <p className="font-mono text-foreground">{formatNumber(activeNode.mention_count)}</p>
            </div>
            <div>
              <p className="text-muted">Reach</p>
              <p className="font-mono text-foreground">{activeNode.reach} platforms</p>
            </div>
            <div>
              <p className="text-muted">Cluster</p>
              <p className="text-foreground">{activeNode.group}</p>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 flex gap-3 rounded-lg border border-border bg-surface/90 px-3 py-2 text-xs backdrop-blur-sm">
        {(["emerging", "growing", "peak", "declining"] as const).map((stage) => (
          <div key={stage} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lifecycleColor(stage) }} />
            <span className="capitalize text-muted">{stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
