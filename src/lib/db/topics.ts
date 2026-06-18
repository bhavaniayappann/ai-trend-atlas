import type { CreateTopicInput, Topic } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import {
  addCustomTopic,
  getCustomTopics,
  mergeCustomTopicsList,
} from "@/lib/data/custom-topics-store";
import { seedTopics } from "@/lib/data/seed";
import { recalculateAndPersistTrendScores } from "@/lib/db/trend-scores";

type DbTopic = Topic & {
  is_custom?: boolean;
  keywords?: string[] | null;
};

export function normalizeTopic(row: DbTopic): Topic {
  const isCustom =
    row.is_custom === true ||
    (row.description?.startsWith("Custom topic:") ?? false);

  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description,
    lifecycle: row.lifecycle,
    created_at: row.created_at,
    is_custom: isCustom,
    keywords: row.keywords ?? [],
  };
}

export async function listTopics(): Promise<Topic[]> {
  if (!isSupabaseConfigured()) {
    return mergeCustomTopicsList(seedTopics);
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listTopics error:", error.message);
    return mergeCustomTopicsList(seedTopics);
  }

  if (!data?.length) return [];
  return data.map((row) => normalizeTopic(row as DbTopic));
}

export async function listCustomTopics(): Promise<Topic[]> {
  const topics = await listTopics();
  return topics.filter((t) => t.is_custom);
}

export function normalizeMatchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function topicMatchesContent(
  topic: Topic,
  title: string,
  body: string | null
): boolean {
  const rawText = `${title} ${body ?? ""}`.toLowerCase();
  const normText = normalizeMatchText(rawText);

  const keywords = topic.keywords?.length
    ? topic.keywords
    : [topic.label, topic.slug.replace(/-/g, " ")];

  const candidates = [...keywords, topic.label, topic.slug.replace(/-/g, " ")];

  return candidates.some((keyword) => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return false;
    if (rawText.includes(trimmed)) return true;
    const normKeyword = normalizeMatchText(trimmed);
    return normKeyword.length >= 2 && normText.includes(normKeyword);
  });
}

export async function matchCustomTopicSlugs(
  title: string,
  body: string | null
): Promise<string[]> {
  const customTopics = await listCustomTopics();
  return customTopics
    .filter((topic) => topicMatchesContent(topic, title, body))
    .map((topic) => topic.slug);
}

export async function createTopic(input: CreateTopicInput): Promise<Topic> {
  const slug = slugify(input.label);
  if (!slug) throw new Error("Topic label must contain at least one letter or number");

  if (!isSupabaseConfigured()) {
    return addCustomTopic(input);
  }

  const supabase = getSupabase()!;
  const keywords = input.keywords?.length
    ? input.keywords.map((k) => k.toLowerCase())
    : [input.label.toLowerCase(), slug.replace(/-/g, " ")];

  const { data, error } = await supabase
    .from("topics")
    .upsert(
      {
        slug,
        label: input.label,
        description: input.description ?? `Custom topic: ${input.label}`,
        lifecycle: "emerging",
        is_custom: true,
        keywords,
      },
      { onConflict: "slug" }
    )
    .select("*")
    .single();

  if (error?.message?.includes("is_custom") || error?.message?.includes("keywords")) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("topics")
      .upsert(
        {
          slug,
          label: input.label,
          description: input.description ?? `Custom topic: ${input.label}`,
          lifecycle: "emerging",
        },
        { onConflict: "slug" }
      )
      .select("*")
      .single();

    if (fallbackError || !fallbackData) {
      throw new Error(fallbackError?.message ?? "Failed to create topic");
    }

    const topic = normalizeTopic({ ...fallbackData, keywords } as DbTopic);
    await recalculateAndPersistTrendScores();
    return topic;
  }

  if (error || !data) throw new Error(error?.message ?? "Failed to create topic");

  const topic = normalizeTopic(data as DbTopic);
  await recalculateAndPersistTrendScores();
  return topic;
}

export async function getTopicKeywordsForExtraction(): Promise<Record<string, string[]>> {
  if (!isSupabaseConfigured()) {
    const map: Record<string, string[]> = {};
    for (const topic of getCustomTopics()) {
      map[topic.slug] = topic.keywords;
    }
    return map;
  }

  const custom = await listCustomTopics();
  const map: Record<string, string[]> = {};
  for (const topic of custom) {
    if (topic.keywords?.length) {
      map[topic.slug] = topic.keywords;
    }
  }
  return map;
}
