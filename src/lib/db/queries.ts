import {
  getSeedGalaxyData,
  getSeedRiverData,
  getTopTrends,
  seedInsights,
  seedTopics,
  seedTrendScores,
} from "@/lib/data/seed";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import type { GalaxyData, Insight, RiverDataPoint, Topic, TrendScore } from "@/lib/types";

function getJoinedTopic(topics: unknown): { slug: string; label: string } | null {
  if (!topics || typeof topics !== "object") return null;
  const t = topics as { slug?: string; label?: string };
  if (!t.slug || !t.label) return null;
  return { slug: t.slug, label: t.label };
}

export async function getGalaxyData(): Promise<GalaxyData> {
  if (!isSupabaseConfigured()) return getSeedGalaxyData();

  const supabase = getSupabase()!;
  const { data: topics } = await supabase.from("topics").select("*");
  const { data: scores } = await supabase
    .from("trend_scores")
    .select("*, topics(slug, label)")
    .order("date", { ascending: false })
    .limit(500);

  if (!topics?.length || !scores?.length) return getSeedGalaxyData();

  const latestScores = new Map<string, TrendScore>();
  for (const s of scores) {
    const topic = getJoinedTopic(s.topics);
    if (!topic || latestScores.has(topic.slug)) continue;
    latestScores.set(topic.slug, {
      id: s.id,
      topic_id: s.topic_id,
      topic_slug: topic.slug,
      topic_label: topic.label,
      date: s.date,
      velocity: s.velocity,
      momentum: s.momentum,
      persistence: s.persistence,
      reach: s.reach,
      sentiment: s.sentiment,
      mention_count: s.mention_count,
    });
  }

  const nodes = topics.map((t: Topic) => {
    const score = latestScores.get(t.slug);
    return {
      id: t.id,
      label: t.label,
      slug: t.slug,
      group: "Topics",
      lifecycle: t.lifecycle,
      velocity: score?.velocity ?? 0,
      reach: score?.reach ?? 1,
      mention_count: score?.mention_count ?? 0,
    };
  });

  return { nodes, edges: getSeedGalaxyData().edges };
}

export async function getRiverData(): Promise<RiverDataPoint[]> {
  if (!isSupabaseConfigured()) return getSeedRiverData();

  const supabase = getSupabase()!;
  const { data } = await supabase
    .from("trend_scores")
    .select("date, mention_count, topics(slug, label)")
    .order("date", { ascending: true })
    .limit(2000);

  if (!data?.length) return getSeedRiverData();

  return data.map((d) => {
    const topic = getJoinedTopic(d.topics);
    return {
      date: d.date,
      topic: topic?.label ?? "Unknown",
      topic_slug: topic?.slug ?? "unknown",
      value: d.mention_count,
    };
  });
}

export async function getTrendingTopics(limit = 8): Promise<TrendScore[]> {
  if (!isSupabaseConfigured()) return getTopTrends(limit);

  const supabase = getSupabase()!;
  const { data } = await supabase
    .from("trend_scores")
    .select("*, topics(slug, label)")
    .order("date", { ascending: false })
    .limit(200);

  if (!data?.length) return getTopTrends(limit);

  const latest = new Map<string, TrendScore>();
  for (const s of data) {
    const topic = getJoinedTopic(s.topics);
    if (!topic || latest.has(topic.slug)) continue;
    latest.set(topic.slug, {
      id: s.id,
      topic_id: s.topic_id,
      topic_slug: topic.slug,
      topic_label: topic.label,
      date: s.date,
      velocity: s.velocity,
      momentum: s.momentum,
      persistence: s.persistence,
      reach: s.reach,
      sentiment: s.sentiment,
      mention_count: s.mention_count,
    });
  }

  return Array.from(latest.values())
    .sort((a, b) => b.velocity - a.velocity)
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
  if (!isSupabaseConfigured()) return seedTopics;

  const supabase = getSupabase()!;
  const { data } = await supabase.from("topics").select("*").order("label");
  return data?.length ? data : seedTopics;
}

export async function getStats() {
  const trends = await getTrendingTopics(100);
  const totalMentions = trends.reduce((s, t) => s + t.mention_count, 0);
  const emerging = trends.filter((t) => t.velocity > 30).length;
  const avgSentiment = trends.length
    ? trends.reduce((s, t) => s + t.sentiment, 0) / trends.length
    : 0;

  return {
    totalTopics: isSupabaseConfigured() ? trends.length : seedTopics.length,
    totalMentions,
    emergingTrends: emerging,
    avgSentiment,
    dataPoints: isSupabaseConfigured() ? trends.length * 31 : seedTrendScores.length,
  };
}
