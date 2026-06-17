import type { ContentItem } from "@/lib/types";

export interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    author: string;
    score: number;
    created_utc: number;
    permalink: string;
    subreddit: string;
    num_comments: number;
  };
}

const AI_SUBREDDITS = [
  "MachineLearning",
  "artificial",
  "LocalLLaMA",
  "ChatGPT",
  "singularity",
  "programming",
];

export async function fetchRedditPosts(
  subreddit = "MachineLearning",
  limit = 25
): Promise<RedditPost["data"][]> {
  const res = await fetch(
    `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
    {
      headers: { "User-Agent": "AI-Trend-Atlas/1.0" },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return [];

  const json = await res.json();
  return (json.data?.children ?? []).map((c: RedditPost) => c.data);
}

export async function fetchAllRedditPosts(limitPerSub = 15): Promise<RedditPost["data"][]> {
  const results = await Promise.all(
    AI_SUBREDDITS.map((sub) => fetchRedditPosts(sub, limitPerSub))
  );
  return results.flat();
}

export function redditPostToContent(
  post: RedditPost["data"]
): Omit<ContentItem, "id" | "ingested_at"> {
  return {
    source: "reddit",
    external_id: post.id,
    url: `https://reddit.com${post.permalink}`,
    title: post.title,
    body: post.selftext || null,
    author: post.author,
    score: post.score,
    metadata: { subreddit: post.subreddit, num_comments: post.num_comments },
    published_at: new Date(post.created_utc * 1000).toISOString(),
  };
}
