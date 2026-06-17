"use client";

import { useEffect, useRef, useState } from "react";
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

export function TopicGalaxy({ data }: TopicGalaxyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<GalaxyNode | null>(null);
  const [hovered, setHovered] = useState<GalaxyNode | null>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

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
    };
    resize();

    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = data.edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        type: e.type,
      }));

    nodesRef.current = nodes;
    linksRef.current = links;

    const { width, height } = container.getBoundingClientRect();

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
      .force("collision", d3.forceCollide().radius(30));

    const draw = () => {
      const { width: w, height: h } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);

      for (const link of links) {
        const s = link.source as SimNode;
        const t = link.target as SimNode;
        if (!s.x || !s.y || !t.x || !t.y) continue;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = `rgba(34, 211, 238, ${link.weight * 0.4})`;
        ctx.lineWidth = link.weight * 2;
        ctx.stroke();
      }

      for (const node of nodes) {
        if (!node.x || !node.y) continue;
        const radius = Math.max(8, Math.min(28, 8 + node.mention_count / 5));
        const isHovered = hovered?.id === node.id;
        const isSelected = selected?.id === node.id;

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
        ctx.font = `${isHovered ? "12px" : "10px"} "Geist Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + radius + 14);
      }

      ctx.restore();
    };

    simRef.current.on("tick", draw);

    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 5])
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        draw();
      });

    d3.select(canvas).call(zoom);

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - transformRef.current.x) / transformRef.current.k;
      const y = (event.clientY - rect.top - transformRef.current.y) / transformRef.current.k;

      let found: SimNode | null = null;
      for (const node of nodes) {
        if (!node.x || !node.y) continue;
        const radius = Math.max(8, Math.min(28, 8 + node.mention_count / 5));
        const dist = Math.hypot(node.x - x, node.y - y);
        if (dist < radius + 5) found = node;
      }
      setSelected(found);
    };

    const handleMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - transformRef.current.x) / transformRef.current.k;
      const y = (event.clientY - rect.top - transformRef.current.y) / transformRef.current.k;

      let found: SimNode | null = null;
      for (const node of nodes) {
        if (!node.x || !node.y) continue;
        const radius = Math.max(8, Math.min(28, 8 + node.mention_count / 5));
        if (Math.hypot(node.x - x, node.y - y) < radius + 5) found = node;
      }
      setHovered(found);
      canvas.style.cursor = found ? "pointer" : "grab";
      draw();
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMove);
    window.addEventListener("resize", resize);

    return () => {
      simRef.current?.stop();
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMove);
      window.removeEventListener("resize", resize);
    };
  }, [data, hovered, selected]);

  const active = selected ?? hovered;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" />

      {active && (
        <div className="absolute right-4 top-4 w-64 rounded-lg border border-border bg-surface/95 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: lifecycleColor(active.lifecycle) }}
            />
            <h3 className="font-semibold text-foreground">{active.label}</h3>
          </div>
          <p className="mt-1 text-xs capitalize text-muted">{active.lifecycle}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted">Velocity</p>
              <p className="font-mono text-accent">{active.velocity.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-muted">Mentions</p>
              <p className="font-mono text-foreground">{formatNumber(active.mention_count)}</p>
            </div>
            <div>
              <p className="text-muted">Reach</p>
              <p className="font-mono text-foreground">{active.reach} platforms</p>
            </div>
            <div>
              <p className="text-muted">Cluster</p>
              <p className="text-foreground">{active.group}</p>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex gap-3 rounded-lg border border-border bg-surface/90 px-3 py-2 text-xs backdrop-blur-sm">
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
