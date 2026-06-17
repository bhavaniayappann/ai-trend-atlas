import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function lifecycleColor(stage: string): string {
  switch (stage) {
    case "emerging":
      return "#22d3ee";
    case "growing":
      return "#34d399";
    case "peak":
      return "#fbbf24";
    case "declining":
      return "#f87171";
    case "dormant":
      return "#6b7280";
    default:
      return "#94a3b8";
  }
}

export function sourceColor(source: string): string {
  switch (source) {
    case "hackernews":
      return "#ff6600";
    case "reddit":
      return "#ff4500";
    case "github":
      return "#8b949e";
    case "youtube":
      return "#ff0000";
    case "news":
      return "#3b82f6";
    default:
      return "#94a3b8";
  }
}
