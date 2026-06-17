import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";

import { searchSeedContent } from "@/lib/data/seed";
import { getSupabase } from "@/lib/db/supabase";
import { generateEmbedding } from "@/lib/ai/embeddings";

export async function buildRAGContext(query: string): Promise<string> {
  const supabase = getSupabase();

  if (supabase && process.env.OPENAI_API_KEY) {
    const embedding = await generateEmbedding(query);
    const { data } = await supabase.rpc("match_content", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 8,
    });

    if (data?.length) {
      return data
        .map(
          (d: { title: string; source: string; summary: string; url: string; similarity: number }) =>
            `[${d.source}] ${d.title}\n${d.summary}\nURL: ${d.url}\nRelevance: ${(d.similarity * 100).toFixed(0)}%`
        )
        .join("\n\n");
    }
  }

  const seedResults = searchSeedContent(query, 8);
  if (seedResults.length === 0) {
    return "No directly relevant content found. Provide general analysis based on known tech trends.";
  }

  return seedResults
    .map(
      (r) =>
        `[${r.source}] ${r.title}\n${r.excerpt}\nTopics: ${r.topics.join(", ")}\nURL: ${r.url}`
    )
    .join("\n\n");
}

export async function createAnalystStream(
  query: string,
  context: string,
  messages: UIMessage[]
) {
  const systemPrompt = `You are the AI Trend Atlas analyst — a Bloomberg Terminal-style intelligence assistant for technology trends.

You analyze data from Reddit, Hacker News, GitHub, and other sources to explain WHY trends are growing.

When answering:
1. Lead with a clear, direct answer
2. Cite specific evidence from the provided context
3. Explain the "why" — what is driving the trend
4. Note cross-platform patterns when visible
5. Be concise but insightful

Retrieved context:
${context}`;

  return streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });
}
