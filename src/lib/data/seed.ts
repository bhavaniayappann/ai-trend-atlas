import { subDays, format } from "date-fns";
import type {
  ContentItem,
  ContentAnalysis,
  Topic,
  TrendScore,
  GalaxyData,
  RiverDataPoint,
  Insight,
} from "@/lib/types";

const now = new Date();

export const seedTopics: Topic[] = [
  { id: "t1", slug: "mcp", label: "MCP", description: "Model Context Protocol for AI tool integration", lifecycle: "growing", created_at: subDays(now, 90).toISOString() },
  { id: "t2", slug: "claude-code", label: "Claude Code", description: "Anthropic's autonomous coding agent", lifecycle: "growing", created_at: subDays(now, 60).toISOString() },
  { id: "t3", slug: "cursor", label: "Cursor", description: "AI-native code editor", lifecycle: "peak", created_at: subDays(now, 180).toISOString() },
  { id: "t4", slug: "ai-agents", label: "AI Agents", description: "Autonomous AI agent frameworks", lifecycle: "growing", created_at: subDays(now, 120).toISOString() },
  { id: "t5", slug: "windsurf", label: "Windsurf", description: "Codeium's AI IDE", lifecycle: "growing", created_at: subDays(now, 45).toISOString() },
  { id: "t6", slug: "rag", label: "RAG", description: "Retrieval-Augmented Generation", lifecycle: "declining", created_at: subDays(now, 365).toISOString() },
  { id: "t7", slug: "graph-rag", label: "Graph RAG", description: "Knowledge graph-based retrieval", lifecycle: "emerging", created_at: subDays(now, 30).toISOString() },
  { id: "t8", slug: "aider", label: "Aider", description: "AI pair programming in terminal", lifecycle: "growing", created_at: subDays(now, 200).toISOString() },
  { id: "t9", slug: "continue", label: "Continue", description: "Open-source AI code assistant", lifecycle: "growing", created_at: subDays(now, 150).toISOString() },
  { id: "t10", slug: "langgraph", label: "LangGraph", description: "Stateful agent orchestration framework", lifecycle: "growing", created_at: subDays(now, 100).toISOString() },
  { id: "t11", slug: "vibe-coding", label: "Vibe Coding", description: "Natural language driven development", lifecycle: "emerging", created_at: subDays(now, 20).toISOString() },
  { id: "t12", slug: "openai-codex", label: "OpenAI Codex", description: "OpenAI coding models and tools", lifecycle: "growing", created_at: subDays(now, 80).toISOString() },
];

function makeContent(
  id: string,
  source: ContentItem["source"],
  title: string,
  body: string,
  topics: string[],
  daysAgo: number,
  score: number
): { content: ContentItem; analysis: ContentAnalysis } {
  const published = subDays(now, daysAgo);
  return {
    content: {
      id,
      source,
      external_id: id,
      url: `https://example.com/${id}`,
      title,
      body,
      author: "community",
      score,
      metadata: {},
      published_at: published.toISOString(),
      ingested_at: now.toISOString(),
    },
    analysis: {
      id: `a-${id}`,
      content_id: id,
      summary: body.slice(0, 200),
      topics,
      sentiment: "positive",
      importance: 0.7 + Math.random() * 0.25,
      analyzed_at: now.toISOString(),
    },
  };
}

const contentPairs = [
  makeContent("c1", "hackernews", "MCP is becoming the USB-C of AI integrations", "Model Context Protocol standardizes how LLMs connect to external tools. Adoption is accelerating across Claude, Cursor, and open-source projects.", ["mcp", "ai-agents"], 2, 842),
  makeContent("c2", "reddit", "Claude Code replaced my entire workflow", "After trying Claude Code for two weeks, I barely touch my IDE. The autonomous coding loops are genuinely transformative for boilerplate and refactoring.", ["claude-code", "vibe-coding"], 1, 1203),
  makeContent("c3", "github", "anthropics/claude-code — 45k stars in 3 months", "Claude Code repository shows explosive growth with daily commits and growing contributor base.", ["claude-code"], 3, 45000),
  makeContent("c4", "hackernews", "Is RAG dead? Graph RAG and agentic retrieval are winning", "Traditional chunk-and-embed RAG pipelines are being replaced by agent-driven retrieval and knowledge graphs.", ["rag", "graph-rag", "ai-agents"], 5, 567),
  makeContent("c5", "reddit", "Cursor vs Windsurf vs Claude Code — 2026 comparison", "Comprehensive comparison of the top AI coding tools. Each has distinct strengths for different workflows.", ["cursor", "windsurf", "claude-code"], 4, 890),
  makeContent("c6", "hackernews", "LangGraph 1.0 released — production-ready agent orchestration", "LangChain's graph-based agent framework hits 1.0 with improved state management and observability.", ["langgraph", "ai-agents"], 6, 423),
  makeContent("c7", "github", "modelcontextprotocol/servers — official MCP server collection", "The official MCP servers repo crossed 20k stars. Stdio and SSE transports now standardized.", ["mcp"], 2, 20000),
  makeContent("c8", "reddit", "Aider is still the best terminal coding agent", "Despite new IDEs, Aider remains unmatched for git-aware pair programming in the terminal.", ["aider"], 7, 445),
  makeContent("c9", "hackernews", "Continue.dev raised funding, going after Cursor", "Open-source Continue announces Series A. VS Code and JetBrains plugins gaining traction.", ["continue", "cursor"], 8, 312),
  makeContent("c10", "reddit", "Vibe coding is not a joke — it's how juniors will start", "Natural language programming is becoming the entry point for new developers. Tools like Claude Code make it real.", ["vibe-coding", "claude-code"], 1, 678),
  makeContent("c11", "github", "langchain-ai/langgraph — agent framework growth", "LangGraph repo stars growing 15% month-over-month with enterprise adoption.", ["langgraph", "ai-agents"], 4, 12000),
  makeContent("c12", "hackernews", "MCP + Claude Code = the future of dev tooling", "Combining MCP servers with Claude Code creates a composable AI development stack.", ["mcp", "claude-code"], 1, 934),
];

export const seedContent: ContentItem[] = contentPairs.map((p) => p.content);
export const seedAnalysis: ContentAnalysis[] = contentPairs.map((p) => p.analysis);

function generateTrendScores(): TrendScore[] {
  const scores: TrendScore[] = [];
  const topicConfigs: Record<string, { base: number; growth: number; reach: number }> = {
    mcp: { base: 5, growth: 0.35, reach: 3 },
    "claude-code": { base: 8, growth: 0.42, reach: 3 },
    cursor: { base: 25, growth: 0.08, reach: 3 },
    "ai-agents": { base: 15, growth: 0.18, reach: 3 },
    windsurf: { base: 6, growth: 0.28, reach: 2 },
    rag: { base: 20, growth: -0.12, reach: 2 },
    "graph-rag": { base: 2, growth: 0.55, reach: 2 },
    aider: { base: 10, growth: 0.1, reach: 2 },
    continue: { base: 7, growth: 0.15, reach: 2 },
    langgraph: { base: 9, growth: 0.22, reach: 2 },
    "vibe-coding": { base: 1, growth: 0.65, reach: 2 },
    "openai-codex": { base: 12, growth: 0.2, reach: 3 },
  };

  for (let day = 30; day >= 0; day--) {
    const date = format(subDays(now, day), "yyyy-MM-dd");
    for (const topic of seedTopics) {
      const config = topicConfigs[topic.slug] ?? { base: 5, growth: 0.1, reach: 1 };
      const dayFactor = 1 + config.growth * (30 - day);
      const noise = 0.85 + Math.random() * 0.3;
      const mentions = Math.round(config.base * dayFactor * noise);
      const velocity = config.growth * 100 * noise;
      const momentum = velocity * (1 + (30 - day) * 0.02);

      scores.push({
        id: `ts-${topic.slug}-${date}`,
        topic_id: topic.id,
        topic_slug: topic.slug,
        topic_label: topic.label,
        date,
        velocity,
        momentum,
        persistence: Math.min(30, day + 1) / 30,
        reach: config.reach,
        sentiment: 0.6 + Math.random() * 0.35,
        mention_count: mentions,
      });
    }
  }

  return scores;
}

export const seedTrendScores = generateTrendScores();

export function getSeedGalaxyData(): GalaxyData {
  const latestScores = new Map<string, TrendScore>();
  for (const score of seedTrendScores) {
    const existing = latestScores.get(score.topic_slug);
    if (!existing || score.date > existing.date) {
      latestScores.set(score.topic_slug, score);
    }
  }

  const nodes = seedTopics.map((topic) => {
    const score = latestScores.get(topic.slug)!;
    return {
      id: topic.id,
      label: topic.label,
      slug: topic.slug,
      group: topic.slug.includes("rag") ? "Retrieval" : topic.slug.includes("code") || ["cursor", "windsurf", "aider", "continue", "vibe-coding"].includes(topic.slug) ? "AI Coding Tools" : topic.slug === "mcp" ? "Infrastructure" : "AI Agents",
      lifecycle: topic.lifecycle,
      velocity: score.velocity,
      reach: score.reach,
      mention_count: score.mention_count,
    };
  });

  const edges: GalaxyData["edges"] = [
    { source: "t1", target: "t2", weight: 0.9, type: "co-occurrence" },
    { source: "t1", target: "t4", weight: 0.7, type: "co-occurrence" },
    { source: "t2", target: "t3", weight: 0.6, type: "similarity" },
    { source: "t2", target: "t5", weight: 0.65, type: "similarity" },
    { source: "t2", target: "t11", weight: 0.8, type: "co-occurrence" },
    { source: "t3", target: "t5", weight: 0.75, type: "similarity" },
    { source: "t3", target: "t9", weight: 0.5, type: "similarity" },
    { source: "t4", target: "t10", weight: 0.85, type: "co-occurrence" },
    { source: "t6", target: "t7", weight: 0.7, type: "similarity" },
    { source: "t8", target: "t9", weight: 0.55, type: "similarity" },
    { source: "t2", target: "t8", weight: 0.45, type: "similarity" },
    { source: "t1", target: "t10", weight: 0.6, type: "co-occurrence" },
    { source: "t12", target: "t2", weight: 0.5, type: "similarity" },
  ];

  return { nodes, edges };
}

export function getSeedRiverData(): RiverDataPoint[] {
  const topTopics = ["mcp", "claude-code", "cursor", "ai-agents", "vibe-coding", "graph-rag"];
  return seedTrendScores
    .filter((s) => topTopics.includes(s.topic_slug))
    .map((s) => ({
      date: s.date,
      topic: s.topic_label,
      topic_slug: s.topic_slug,
      value: s.mention_count,
    }));
}

export const seedInsights: Insight[] = [
  {
    id: "i1",
    topic_id: "t2",
    topic_label: "Claude Code",
    text: "Claude Code discussions increased 340% after Anthropic released autonomous coding workflows.",
    confidence: 0.92,
    created_at: subDays(now, 1).toISOString(),
  },
  {
    id: "i2",
    topic_id: "t1",
    topic_label: "MCP",
    text: "MCP adoption correlates strongly with Claude Code growth — 78% of MCP mentions co-occur with coding agent discussions.",
    confidence: 0.88,
    created_at: subDays(now, 2).toISOString(),
  },
  {
    id: "i3",
    topic_id: "t7",
    topic_label: "Graph RAG",
    text: "Graph RAG mention velocity is 4.2x traditional RAG, suggesting a paradigm shift in retrieval architecture.",
    confidence: 0.85,
    created_at: subDays(now, 3).toISOString(),
  },
  {
    id: "i4",
    topic_id: "t11",
    topic_label: "Vibe Coding",
    text: "Vibe Coding emerged as a distinct topic only 3 weeks ago but already shows the fastest growth rate in the atlas.",
    confidence: 0.79,
    created_at: subDays(now, 1).toISOString(),
  },
];

export function getTopTrends(limit = 8) {
  const latest = new Map<string, TrendScore>();
  for (const score of seedTrendScores) {
    const existing = latest.get(score.topic_slug);
    if (!existing || score.date > existing.date) {
      latest.set(score.topic_slug, score);
    }
  }
  return Array.from(latest.values())
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, limit);
}

export function searchSeedContent(query: string, limit = 5) {
  const q = query.toLowerCase();
  const results = contentPairs
    .map((p) => {
      const text = `${p.content.title} ${p.content.body} ${p.analysis.topics.join(" ")}`.toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);
      const matches = terms.filter((t) => text.includes(t)).length;
      return { ...p, relevance: matches / Math.max(terms.length, 1) };
    })
    .filter((p) => p.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);

  return results.map((p) => ({
    title: p.content.title,
    url: p.content.url,
    source: p.content.source,
    excerpt: p.analysis.summary,
    topics: p.analysis.topics,
    relevance: p.relevance,
  }));
}
