import type { CreateTopicInput, GalaxyData, Topic, TrendScore } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { format } from "date-fns";

interface StoredCustomTopic extends Topic {
  is_custom: true;
  keywords: string[];
}

const customTopics: StoredCustomTopic[] = [];

export function getCustomTopics(): StoredCustomTopic[] {
  return [...customTopics];
}

export function getCustomTopicKeywordMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const topic of customTopics) {
    map[topic.slug] = topic.keywords;
  }
  return map;
}

export function addCustomTopic(input: CreateTopicInput): StoredCustomTopic {
  const slug = slugify(input.label);
  const existing = customTopics.find((t) => t.slug === slug);
  if (existing) return existing;

  const keywords = input.keywords?.length
    ? input.keywords.map((k) => k.toLowerCase())
    : [input.label.toLowerCase(), slug.replace(/-/g, " ")];

  const topic: StoredCustomTopic = {
    id: `custom-${slug}`,
    slug,
    label: input.label,
    description: input.description ?? null,
    lifecycle: "emerging",
    created_at: new Date().toISOString(),
    is_custom: true,
    keywords,
  };

  customTopics.push(topic);
  return topic;
}

export function getCustomTrendScores(): TrendScore[] {
  const today = format(new Date(), "yyyy-MM-dd");
  return customTopics.map((topic) => ({
    id: `custom-ts-${topic.slug}`,
    topic_id: topic.id,
    topic_slug: topic.slug,
    topic_label: topic.label,
    date: today,
    velocity: 25,
    momentum: 10,
    persistence: 0.1,
    reach: 1,
    sentiment: 0.7,
    mention_count: 1,
  }));
}

export function mergeCustomTopicsIntoGalaxy(base: GalaxyData): GalaxyData {
  if (customTopics.length === 0) return base;

  const customScores = getCustomTrendScores();
  const customNodes = customTopics.map((topic) => {
    const score = customScores.find((s) => s.topic_slug === topic.slug)!;
    return {
      id: topic.id,
      label: topic.label,
      slug: topic.slug,
      group: "Custom",
      lifecycle: topic.lifecycle,
      velocity: score.velocity,
      reach: score.reach,
      mention_count: score.mention_count,
    };
  });

  return {
    nodes: [...base.nodes, ...customNodes],
    edges: base.edges,
  };
}

export function mergeCustomTopicsIntoTrends(base: TrendScore[], limit: number): TrendScore[] {
  const customScores = getCustomTrendScores();
  const seen = new Set(base.map((t) => t.topic_slug));
  const merged = [
    ...base,
    ...customScores.filter((s) => !seen.has(s.topic_slug)),
  ];
  return merged.sort((a, b) => b.velocity - a.velocity).slice(0, limit);
}

export function mergeCustomTopicsList(base: Topic[]): Topic[] {
  const seen = new Set(base.map((t) => t.slug));
  return [...base, ...customTopics.filter((t) => !seen.has(t.slug))];
}
