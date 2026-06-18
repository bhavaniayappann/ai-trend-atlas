import {
  getSeedRiverData,
  getTopTrends,
  seedInsights,
  seedTopics,
  seedTrendScores,
} from "@/lib/data/seed";
import { getCustomTopics, getCustomTrendScores, mergeCustomTopicsIntoTrends } from "@/lib/data/custom-topics-store";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { listCustomTopics, normalizeTopic } from "@/lib/db/topics";
import {
  getComputedTrendScores,
  getDailyRiverScores,
} from "@/lib/db/trend-scores";
import type { GalaxyData, Insight, RiverDataPoint, Topic, TrendScore } from "@/lib/types";

function getJoinedTopic(topics: unknown): { slug: string; label: string } | null {
  if (!topics || typeof topics !== "object") return null;
  const t = topics as { slug?: string; label?: string };
  if (!t.slug || !t.label) return null;
  return { slug: t.slug, label: t.label };
}

function buildGalaxyNodes(topics: Topic[], scores: TrendScore[]): GalaxyData["nodes"] {
  const scoreMap = new Map(scores.map((s) => [s.topic_slug, s]));

  return topics.map((topic) => {
    const score = scoreMap.get(topic.slug);
    return {
      id: topic.id,
      label: topic.label,
      slug: topic.slug,
      group: "Custom",
      lifecycle: topic.lifecycle,
      velocity: score?.velocity ?? 0,
      reach: score?.reach ?? 0,
      mention_count: score?.mention_count ?? 0,
    };
  });
}

export async function getGalaxyData(): Promise<GalaxyData> {
  if (!isSupabaseConfigured()) {
    const customTopics = getCustomTopics();
    return {
      nodes: buildGalaxyNodes(customTopics, getCustomTrendScores()),
      edges: [],
    };
  }

  const customTopics = await listCustomTopics();
  if (!customTopics.length) return { nodes: [], edges: [] };

  const scores = await getComputedTrendScores();
  return {
    nodes: buildGalaxyNodes(customTopics, scores),
    edges: [],
  };
}

export async function getRiverData(): Promise<RiverDataPoint[]> {
  if (!isSupabaseConfigured()) {
    const customSlugs = new Set(getCustomTopics().map((t) => t.slug));
    if (!customSlugs.size) return [];

    return getSeedRiverData().filter((p) => customSlugs.has(p.topic_slug));
  }

  const customTopics = await listCustomTopics();
  if (!customTopics.length) return [];

  const customSlugs = new Set(customTopics.map((t) => t.slug));
  const points = await getDailyRiverScores();

  return points
    .filter((p) => customSlugs.has(p.topic_slug))
    .map((p) => ({
      date: p.date,
      topic: p.topic_label,
      topic_slug: p.topic_slug,
      value: p.value,
    }));
}

export async function getTrendingTopics(limit = 8): Promise<TrendScore[]> {
  if (!isSupabaseConfigured()) return mergeCustomTopicsIntoTrends(getTopTrends(limit), limit);

  const scores = await getComputedTrendScores();
  if (!scores.length) return getTopTrends(limit);

  const customSlugs = new Set((await listCustomTopics()).map((t) => t.slug));

  return scores
    .sort((a, b) => {
      const aIsCustom = customSlugs.has(a.topic_slug);
      const bIsCustom = customSlugs.has(b.topic_slug);
      if (aIsCustom && !bIsCustom) return -1;
      if (!aIsCustom && bIsCustom) return 1;
      if (b.mention_count !== a.mention_count) return b.mention_count - a.mention_count;
      return b.velocity - a.velocity;
    })
    .slice(0, limit);
}

export async function getInsights(): Promise<Insight[]> {
  if (!isSupabaseConfigured()) return seedInsights;

  const supabase = getSupabase()!;
  const { data } = await supabase
    .from("insights")
    .select("*, topics(label)")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!data?.length) return seedInsights;

  return data.map((i) => {
    const topic = getJoinedTopic(i.topics);
    return {
      id: i.id,
      topic_id: i.topic_id,
      topic_label: topic?.label ?? "Unknown",
      text: i.text,
      confidence: i.confidence,
      created_at: i.created_at,
    };
  });
}

export async function getAllTopics(): Promise<Topic[]> {
  const { listTopics } = await import("@/lib/db/topics");
  return listTopics();
}

export async function getStats() {
  const [trends, allTopics] = await Promise.all([
    getTrendingTopics(100),
    getAllTopics(),
  ]);
  const totalMentions = trends.reduce((s, t) => s + t.mention_count, 0);
  const emerging = trends.filter((t) => t.velocity > 30).length;
  const avgSentiment = trends.length
    ? trends.reduce((s, t) => s + t.sentiment, 0) / trends.length
    : 0;

  return {
    totalTopics: allTopics.length,
    totalMentions,
    emergingTrends: emerging,
    avgSentiment,
    dataPoints: isSupabaseConfigured() ? trends.length * 31 : seedTrendScores.length,
  };
}
