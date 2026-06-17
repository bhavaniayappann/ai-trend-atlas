import type { ContentItem } from "@/lib/types";

export interface GitHubRepo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  owner: { login: string };
  topics?: string[];
}

const AI_QUERIES = [
  "topic:ai-agents stars:>100",
  "topic:llm stars:>500",
  "topic:mcp stars:>50",
  "claude code in:name,description stars:>100",
  "cursor ai editor stars:>200",
];

export async function searchGitHubRepos(
  query: string,
  token?: string,
  perPage = 10
): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`,
    { headers, next: { revalidate: 3600 } }
  );

  if (!res.ok) return [];

  const json = await res.json();
  return json.items ?? [];
}

export async function fetchTrendingAIRepos(token?: string): Promise<GitHubRepo[]> {
  const results = await Promise.all(
    AI_QUERIES.map((q) => searchGitHubRepos(q, token, 5))
  );
  const seen = new Set<number>();
  return results.flat().filter((repo) => {
    if (seen.has(repo.id)) return false;
    seen.add(repo.id);
    return true;
  });
}

export function githubRepoToContent(
  repo: GitHubRepo
): Omit<ContentItem, "id" | "ingested_at"> {
  return {
    source: "github",
    external_id: String(repo.id),
    url: repo.html_url,
    title: repo.full_name,
    body: repo.description,
    author: repo.owner.login,
    score: repo.stargazers_count,
    metadata: {
      forks: repo.forks_count,
      language: repo.language,
      topics: repo.topics ?? [],
    },
    published_at: repo.created_at,
  };
}
