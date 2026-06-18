import { format, subDays, parseISO } from "date-fns";
import type { TrendScore, Topic, Sentiment } from "@/lib/types";
import {
  computeVelocity,
  computeMomentum,
  computePersistence,
} from "@/lib/scoring/trends";
import { getSupabase } from "@/lib/db/supabase";
import { normalizeTopic } from "@/lib/db/topics";

interface MentionRow {
  topic_id: string;
  slug: string;
  label: string;
  source: string;
  published_at: string;
  sentiment: Sentiment | null;
}

function sentimentToScore(sentiment: Sentiment | null): number {
  if (sentiment === "positive") return 0.85;
  if (sentiment === "negative") return 0.25;
  return 0.55;
}

export function computeTopicScore(
  topic: Topic,
  mentions: MentionRow[],
  today = new Date()
): TrendScore {
  const todayStr = format(today, "yyyy-MM-dd");
  const topicMentions = mentions.filter((m) => m.topic_id === topic.id);

  if (topicMentions.length === 0) {
    return {
      id: `computed-${topic.slug}`,
      topic_id: topic.id,
      topic_slug: topic.slug,
      topic_label: topic.label,
      date: todayStr,
      velocity: 0,
      momentum: 0,
      persistence: 0,
      reach: 0,
      sentiment: 0.5,
      mention_count: 0,
    };
  }

  const last7d = subDays(today, 7).getTime();
  const prev7d = subDays(today, 14).getTime();
  const last30d = subDays(today, 30).getTime();

  const recent = topicMentions.filter(
    (m) => parseISO(m.published_at).getTime() >= last7d
  );
  const previous = topicMentions.filter((m) => {
    const t = parseISO(m.published_at).getTime();
    return t >= prev7d && t < last7d;
  });
  const inWindow = topicMentions.filter(
    (m) => parseISO(m.published_at).getTime() >= last30d
  );

  const activeDays = new Set(
    inWindow.map((m) => format(parseISO(m.published_at), "yyyy-MM-dd"))
  ).size;

  const dailyVelocities: number[] = [];
  for (let d = 13; d >= 0; d--) {
    const dayEnd = subDays(today, d);
    const dayStart = subDays(today, d + 1);
    const dayCount = topicMentions.filter((m) => {
      const t = parseISO(m.published_at);
      return t >= dayStart && t < dayEnd;
    }).length;
    const prevDayCount = topicMentions.filter((m) => {
      const t = parseISO(m.published_at);
      return t >= subDays(dayStart, 1) && t < dayStart;
    }).length;
    dailyVelocities.push(computeVelocity(dayCount, prevDayCount));
  }

  const sources = new Set(recent.map((m) => m.source));
  const allSources = new Set(topicMentions.map((m) => m.source));
  const sentimentAvg =
    topicMentions.reduce((s, m) => s + sentimentToScore(m.sentiment), 0) /
    topicMentions.length;

  return {
    id: `computed-${topic.slug}`,
    topic_id: topic.id,
    topic_slug: topic.slug,
    topic_label: topic.label,
    date: todayStr,
    velocity: computeVelocity(recent.length, previous.length),
    momentum: computeMomentum(dailyVelocities),
    persistence: computePersistence(activeDays, 30),
    reach: sources.size || allSources.size,
    sentiment: sentimentAvg,
    mention_count: topicMentions.length,
  };
}

export async function fetchMentionRows(): Promise<MentionRow[]> {
  const supabase = getSupabase()!;

  const { data: mentions, error } = await supabase
    .from("topic_mentions")
    .select("topic_id, content_id, topics ( id, slug, label )");

  if (error || !mentions?.length) return [];

  const contentIds = [...new Set(mentions.map((m) => m.content_id as string))];

  const [{ data: contents }, { data: analyses }] = await Promise.all([
    supabase
      .from("content")
      .select("id, source, published_at")
      .in("id", contentIds),
    supabase
      .from("content_analysis")
      .select("content_id, sentiment")
      .in("content_id", contentIds),
  ]);

  const contentMap = new Map((contents ?? []).map((c) => [c.id, c]));
  const analysisMap = new Map((analyses ?? []).map((a) => [a.content_id, a]));

  return mentions
    .map((row) => {
      const raw = row.topics;
      const topic = Array.isArray(raw) ? raw[0] : raw;
      const topicData = topic as { id: string; slug: string; label: string } | null | undefined;
      const content = contentMap.get(row.content_id as string);
      if (!topicData?.id || !content) return null;

      const analysis = analysisMap.get(row.content_id as string);
      return {
        topic_id: topicData.id,
        slug: topicData.slug,
        label: topicData.label,
        source: content.source,
        published_at: content.published_at,
        sentiment: (analysis?.sentiment as Sentiment) ?? null,
      };
    })
    .filter(Boolean) as MentionRow[];
}

export async function getComputedTrendScores(): Promise<TrendScore[]> {
  const supabase = getSupabase()!;

  const { data: topicRows } = await supabase.from("topics").select("*");
  if (!topicRows?.length) return [];

  const topics = topicRows.map((r) => normalizeTopic(r));
  const mentions = await fetchMentionRows();

  return topics
    .map((topic) => computeTopicScore(topic, mentions))
    .sort((a, b) => {
      if (b.mention_count !== a.mention_count) return b.mention_count - a.mention_count;
      return b.velocity - a.velocity;
    });
}

export async function recalculateAndPersistTrendScores(): Promise<number> {
  const { backfillCustomTopicMentions } = await import("@/lib/db/backfill");
  await backfillCustomTopicMentions();

  const supabase = getSupabase()!;
  const scores = await getComputedTrendScores();
  const today = format(new Date(), "yyyy-MM-dd");

  for (const score of scores) {
    await supabase.from("trend_scores").upsert(
      {
        topic_id: score.topic_id,
        date: today,
        velocity: score.velocity,
        momentum: score.momentum,
        persistence: score.persistence,
        reach: score.reach,
        sentiment: score.sentiment,
        mention_count: score.mention_count,
      },
      { onConflict: "topic_id,date" }
    );

    const lifecycle =
      score.mention_count === 0
        ? "emerging"
        : score.velocity > 15
          ? "growing"
          : score.velocity < -10
            ? "declining"
            : "peak";

    await supabase.from("topics").update({ lifecycle }).eq("id", score.topic_id);
  }

  return scores.length;
}

export async function getDailyRiverScores(): Promise<
  { date: string; topic_slug: string; topic_label: string; value: number }[]
> {
  const supabase = getSupabase()!;
  const { data: topicRows } = await supabase.from("topics").select("*");
  if (!topicRows?.length) return [];

  const topics = topicRows.map((r) => normalizeTopic(r));
  const mentions = await fetchMentionRows();
  const points: { date: string; topic_slug: string; topic_label: string; value: number }[] = [];

  const dates = new Set<string>();
  for (const m of mentions) {
    dates.add(format(parseISO(m.published_at), "yyyy-MM-dd"));
  }

  for (const date of Array.from(dates).sort()) {
    for (const topic of topics) {
      const count = mentions.filter(
        (m) =>
          m.topic_id === topic.id &&
          format(parseISO(m.published_at), "yyyy-MM-dd") === date
      ).length;
      if (count > 0) {
        points.push({
          date,
          topic_slug: topic.slug,
          topic_label: topic.label,
          value: count,
        });
      }
    }
  }

  return points;
}
