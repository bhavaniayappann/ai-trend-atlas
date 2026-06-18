import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getCustomTopicKeywordMap } from "@/lib/data/custom-topics-store";
import type { Sentiment } from "@/lib/types";

const analysisSchema = z.object({
  summary: z.string().describe("2-3 sentence summary of the content"),
  topics: z.array(z.string()).max(5).describe("Key technology topics mentioned"),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  importance: z.number().min(0).max(1).describe("How important this is for tech trend tracking"),
});

export type ContentAnalysisResult = z.infer<typeof analysisSchema>;

export async function extractTopics(
  title: string,
  body: string | null
): Promise<ContentAnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackExtraction(title, body);
  }

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: analysisSchema,
    prompt: `Analyze this technology content and extract trend-relevant information.

Title: ${title}
Content: ${body ?? "(no body)"}

Focus on AI, developer tools, frameworks, and emerging technology topics.
Use lowercase slug-style topic names (e.g. "mcp", "claude-code", "ai-agents").`,
  });

  return object;
}

function fallbackExtraction(title: string, body: string | null): ContentAnalysisResult {
  const text = `${title} ${body ?? ""}`.toLowerCase();
  const topicMap: Record<string, string[]> = {
    mcp: ["mcp", "model context protocol"],
    "claude-code": ["claude code", "claude-code"],
    cursor: ["cursor"],
    "ai-agents": ["ai agent", "agents", "agentic"],
    windsurf: ["windsurf", "codeium"],
    rag: ["rag", "retrieval-augmented"],
    "graph-rag": ["graph rag", "knowledge graph"],
    aider: ["aider"],
    continue: ["continue.dev", "continue dev"],
    langgraph: ["langgraph", "langchain"],
    "vibe-coding": ["vibe coding", "vibe-coding"],
    ...getCustomTopicKeywordMap(),
  };

  const topics: string[] = [];
  for (const [slug, keywords] of Object.entries(topicMap)) {
    if (keywords.some((k) => text.includes(k))) topics.push(slug);
  }
  if (topics.length === 0) topics.push("ai");

  return {
    summary: body ? body.slice(0, 200) : title,
    topics,
    sentiment: "neutral" as Sentiment,
    importance: 0.5,
  };
}

export async function generateInsight(
  topicLabel: string,
  trendData: { velocity: number; momentum: number; mention_count: number },
  recentTitles: string[]
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return `${topicLabel} shows ${trendData.velocity > 20 ? "strong" : "moderate"} growth with ${trendData.mention_count} mentions across tracked platforms.`;
  }

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({ insight: z.string() }),
    prompt: `Generate a single concise insight (1-2 sentences) about the technology trend "${topicLabel}".

Velocity: ${trendData.velocity.toFixed(1)}%
Momentum: ${trendData.momentum.toFixed(1)}
Mentions: ${trendData.mention_count}
Recent discussions: ${recentTitles.slice(0, 5).join("; ")}

Write like a Bloomberg analyst — specific, data-driven, actionable.`,
  });

  return object.insight;
}
