export type ContentSource = "reddit" | "hackernews" | "github" | "youtube" | "news" | "google_trends";

export type Sentiment = "positive" | "neutral" | "negative";

export type LifecycleStage = "emerging" | "growing" | "peak" | "declining" | "dormant";

export interface ContentItem {
  id: string;
  source: ContentSource;
  external_id: string;
  url: string;
  title: string;
  body: string | null;
  author: string | null;
  score: number;
  metadata: Record<string, unknown>;
  published_at: string;
  ingested_at: string;
}

export interface ContentAnalysis {
  id: string;
  content_id: string;
  summary: string;
  topics: string[];
  sentiment: Sentiment;
  importance: number;
  analyzed_at: string;
}

export interface Topic {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  lifecycle: LifecycleStage;
  created_at: string;
  is_custom?: boolean;
  keywords?: string[];
}

export interface CreateTopicInput {
  label: string;
  description?: string;
  keywords?: string[];
}

export interface TrendScore {
  id: string;
  topic_id: string;
  topic_slug: string;
  topic_label: string;
  date: string;
  velocity: number;
  momentum: number;
  persistence: number;
  reach: number;
  sentiment: number;
  mention_count: number;
}

export interface GalaxyNode {
  id: string;
  label: string;
  slug: string;
  group: string;
  lifecycle: LifecycleStage;
  velocity: number;
  reach: number;
  mention_count: number;
  x?: number;
  y?: number;
}

export interface GalaxyEdge {
  source: string;
  target: string;
  weight: number;
  type: "similarity" | "co-occurrence";
}

export interface GalaxyData {
  nodes: GalaxyNode[];
  edges: GalaxyEdge[];
}

export interface RiverDataPoint {
  date: string;
  topic: string;
  topic_slug: string;
  value: number;
}

export interface Insight {
  id: string;
  topic_id: string;
  topic_label: string;
  text: string;
  confidence: number;
  created_at: string;
}

export interface ChatCitation {
  title: string;
  url: string;
  source: ContentSource;
  excerpt: string;
}
