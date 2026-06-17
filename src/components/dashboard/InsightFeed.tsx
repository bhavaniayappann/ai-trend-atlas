import type { Insight } from "@/lib/types";
import { Sparkles } from "lucide-react";

interface InsightFeedProps {
  insights: Insight[];
}

export function InsightFeed({ insights }: InsightFeedProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">AI Insights</h2>
      </div>
      {insights.map((insight) => (
        <div
          key={insight.id}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              {insight.topic_label}
            </span>
            <span className="text-xs text-muted">
              {(insight.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {insight.text}
          </p>
        </div>
      ))}
    </div>
  );
}
