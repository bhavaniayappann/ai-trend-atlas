import type { CreateTopicInput, Topic } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import {
  addCustomTopic,
  getCustomTopics,
  mergeCustomTopicsList,
} from "@/lib/data/custom-topics-store";
import { seedTopics } from "@/lib/data/seed";

export async function listTopics(): Promise<Topic[]> {
  if (!isSupabaseConfigured()) {
    return mergeCustomTopicsList(seedTopics);
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return mergeCustomTopicsList(seedTopics);
  return data;
}

export async function createTopic(input: CreateTopicInput): Promise<Topic> {
  const slug = slugify(input.label);
  if (!slug) throw new Error("Topic label must contain at least one letter or number");

  if (!isSupabaseConfigured()) {
    return addCustomTopic(input);
  }

  const supabase = getSupabase()!;
  const keywords = input.keywords?.length
    ? input.keywords
    : [input.label, slug.replace(/-/g, " ")];

  const { data, error } = await supabase
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

  if (error || !data) throw new Error(error?.message ?? "Failed to create topic");

  return {
    ...data,
    is_custom: true,
    keywords,
  };
}

export function getTopicKeywordsForExtraction(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const topic of getCustomTopics()) {
    map[topic.slug] = topic.keywords;
  }
  return map;
}
