import { getSupabase } from "@/lib/db/supabase";
import { listCustomTopics, topicMatchesContent } from "@/lib/db/topics";

export async function backfillCustomTopicMentions(): Promise<number> {
  const supabase = getSupabase()!;
  const customTopics = await listCustomTopics();
  if (!customTopics.length) return 0;

  const { data: contents, error } = await supabase
    .from("content")
    .select("id, title, body");

  if (error || !contents?.length) return 0;

  let linked = 0;

  for (const content of contents) {
    for (const topic of customTopics) {
      if (!topicMatchesContent(topic, content.title, content.body)) continue;

      const { error: mentionError } = await supabase.from("topic_mentions").upsert(
        { content_id: content.id, topic_id: topic.id, confidence: 0.95 },
        { onConflict: "content_id,topic_id" }
      );

      if (!mentionError) linked++;
    }
  }

  return linked;
}
