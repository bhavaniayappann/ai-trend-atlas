import { formatNumber } from "@/lib/utils";
import { Activity, Flame, BarChart3, Heart } from "lucide-react";

interface StatsBarProps {
  stats: {
    totalTopics: number;
    totalMentions: number;
    emergingTrends: number;
    avgSentiment: number;
    dataPoints: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Topics Tracked", value: stats.totalTopics, icon: BarChart3 },
    { label: "Total Mentions", value: formatNumber(stats.totalMentions), icon: Activity },
    { label: "Emerging", value: stats.emergingTrends, icon: Flame },
    { label: "Avg Sentiment", value: `${(stats.avgSentiment * 100).toFixed(0)}%`, icon: Heart },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs text-muted">{label}</span>
          </div>
          <p className="mt-1 font-mono text-xl font-semibold text-foreground">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
