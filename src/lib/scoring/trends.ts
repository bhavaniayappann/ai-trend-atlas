import type { TrendScore, LifecycleStage } from "@/lib/types";

export function computeVelocity(
  currentMentions: number,
  previousMentions: number
): number {
  if (previousMentions === 0) return currentMentions > 0 ? 100 : 0;
  return ((currentMentions - previousMentions) / previousMentions) * 100;
}

export function computeMomentum(velocities: number[]): number {
  if (velocities.length < 2) return velocities[0] ?? 0;
  const recent = velocities.slice(-3);
  const older = velocities.slice(-6, -3);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : 0;
  return recentAvg - olderAvg;
}

export function computePersistence(activeDays: number, windowDays: number): number {
  return Math.min(1, activeDays / windowDays);
}

export function computeReach(platforms: string[]): number {
  return platforms.length;
}

export function determineLifecycle(
  velocity: number,
  momentum: number,
  persistence: number
): LifecycleStage {
  if (persistence < 0.1 && velocity > 30) return "emerging";
  if (velocity > 15 && momentum > 0) return "growing";
  if (velocity > -5 && velocity < 15 && persistence > 0.5) return "peak";
  if (velocity < -10) return "declining";
  if (persistence < 0.2) return "dormant";
  return "growing";
}

export function aggregateTrendScores(
  scores: TrendScore[]
): Map<string, TrendScore> {
  const latest = new Map<string, TrendScore>();
  for (const score of scores) {
    const existing = latest.get(score.topic_slug);
    if (!existing || score.date > existing.date) {
      latest.set(score.topic_slug, score);
    }
  }
  return latest;
}

export function buildCoOccurrenceEdges(
  mentions: { content_id: string; topics: string[] }[],
  topicIdMap: Map<string, string>
): { source: string; target: string; weight: number }[] {
  const pairCounts = new Map<string, number>();

  for (const mention of mentions) {
    const topicIds = mention.topics
      .map((t) => topicIdMap.get(t))
      .filter(Boolean) as string[];

    for (let i = 0; i < topicIds.length; i++) {
      for (let j = i + 1; j < topicIds.length; j++) {
        const key = [topicIds[i], topicIds[j]].sort().join(":");
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const maxCount = Math.max(...pairCounts.values(), 1);
  return Array.from(pairCounts.entries()).map(([key, count]) => {
    const [source, target] = key.split(":");
    return { source, target, weight: count / maxCount };
  });
}
