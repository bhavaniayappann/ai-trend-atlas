import type { TrendScore } from "@/lib/types";
import { formatPercent, formatNumber, lifecycleColor } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendCardProps {
  trend: TrendScore;
  rank: number;
}

export function TrendCard({ trend, rank }: TrendCardProps) {
  const velocityIcon =
    trend.velocity > 10 ? (
      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
    ) : trend.velocity < -5 ? (
      <TrendingDown className="h-3.5 w-3.5 text-red-400" />
    ) : (
      <Minus className="h-3.5 w-3.5 text-muted" />
    );

  return (
    <div className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-muted">#{rank}</span>
          <h3 className="font-semibold text-foreground">{trend.topic_label}</h3>
        </div>
        <div className="flex items-center gap-1">
          {velocityIcon}
          <span className="font-mono text-sm text-accent">
            {formatPercent(trend.velocity)}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-muted">Mentions</p>
          <p className="font-mono text-foreground">{formatNumber(trend.mention_count)}</p>
        </div>
        <div>
          <p className="text-muted">Momentum</p>
          <p className="font-mono text-foreground">{trend.momentum.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-muted">Reach</p>
          <p className="font-mono text-foreground">{trend.reach} src</p>
        </div>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, trend.sentiment * 100)}%`,
            backgroundColor: lifecycleColor(
              trend.velocity > 30 ? "growing" : trend.velocity < -10 ? "declining" : "peak"
            ),
          }}
        />
      </div>
    </div>
  );
}
