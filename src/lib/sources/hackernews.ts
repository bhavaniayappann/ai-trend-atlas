import type { ContentItem } from "@/lib/types";

export interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  text?: string;
}

export async function fetchHNTopStories(limit = 30): Promise<HNStory[]> {
  const topRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
    next: { revalidate: 900 },
  });
  const ids: number[] = await topRes.json();
  const stories = await Promise.all(
    ids.slice(0, limit).map(async (id) => {
      const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
        next: { revalidate: 900 },
      });
      return res.json() as Promise<HNStory>;
    })
  );
  return stories.filter((s) => s && s.title);
}

export function hnStoryToContent(story: HNStory): Omit<ContentItem, "id" | "ingested_at"> {
  return {
    source: "hackernews",
    external_id: String(story.id),
    url: story.url ?? `https://news.ycombinator.com/item?id=${story.id}`,
    title: story.title,
    body: story.text ?? null,
    author: story.by,
    score: story.score,
    metadata: { descendants: story.descendants ?? 0 },
    published_at: new Date(story.time * 1000).toISOString(),
  };
}

export async function fetchHNNewStories(limit = 30): Promise<HNStory[]> {
  const res = await fetch("https://hacker-news.firebaseio.com/v0/newstories.json", {
    next: { revalidate: 900 },
  });
  const ids: number[] = await res.json();
  const stories = await Promise.all(
    ids.slice(0, limit).map(async (id) => {
      const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
        next: { revalidate: 900 },
      });
      return itemRes.json() as Promise<HNStory>;
    })
  );
  return stories.filter((s) => s && s.title);
}
