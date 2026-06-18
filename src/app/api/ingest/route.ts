import { NextResponse } from "next/server";
import { fetchHNTopStories, hnStoryToContent } from "@/lib/sources/hackernews";
import { fetchAllRedditPosts, redditPostToContent } from "@/lib/sources/reddit";
import { fetchTrendingAIRepos, githubRepoToContent } from "@/lib/sources/github";
import { extractTopics } from "@/lib/ai/extract";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { matchCustomTopicSlugs, listCustomTopics } from "@/lib/db/topics";
import { recalculateAndPersistTrendScores } from "@/lib/db/trend-scores";
import { backfillCustomTopicMentions } from "@/lib/db/backfill";
export const maxDuration = 60;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const isProduction = process.env.NODE_ENV === "production";

  if (
    isProduction &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { hackernews: 0, reddit: 0, github: 0, errors: [] as string[] };

  try {
    const hnStories = await fetchHNTopStories(20);
    const redditPosts = await fetchAllRedditPosts(10);
    const githubRepos = await fetchTrendingAIRepos(process.env.GITHUB_TOKEN);

    const items = [
      ...hnStories.map(hnStoryToContent),
      ...redditPosts.map(redditPostToContent),
      ...githubRepos.map(githubRepoToContent),
    ];

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        message: "Ingestion complete (demo mode — Supabase not configured)",
        itemsFound: items.length,
        sources: {
          hackernews: hnStories.length,
          reddit: redditPosts.length,
          github: githubRepos.length,
        },
      });
    }

    const supabase = getSupabase()!;
    const customTopics = await listCustomTopics();
    const customTopicBySlug = new Map(customTopics.map((t) => [t.slug, t]));

    for (const item of items) {
      try {
        const { data: existing } = await supabase
          .from("content")
          .select("id")
          .eq("source", item.source)
          .eq("external_id", item.external_id)
          .single();

        if (existing) continue;

        const { data: content, error } = await supabase
          .from("content")
          .insert(item)
          .select("id")
          .single();

        if (error || !content) {
          results.errors.push(`${item.source}/${item.external_id}: ${error?.message}`);
          continue;
        }

        const analysis = await extractTopics(item.title, item.body);
        const customMatches = await matchCustomTopicSlugs(item.title, item.body);
        const allTopicSlugs = [...new Set([...analysis.topics, ...customMatches])];

        await supabase.from("content_analysis").insert({
          content_id: content.id,
          ...analysis,
          topics: allTopicSlugs,
        });

        const embedding = await generateEmbedding(`${item.title} ${item.body ?? ""}`);
        await supabase.from("embeddings").insert({
          content_id: content.id,
          embedding,
        });

        for (const topicSlug of allTopicSlugs) {
          const existingCustom = customTopicBySlug.get(topicSlug);

          if (existingCustom) {
            await supabase.from("topic_mentions").upsert(
              { content_id: content.id, topic_id: existingCustom.id, confidence: 0.95 },
              { onConflict: "content_id,topic_id" }
            );
            continue;
          }

          const { data: topic } = await supabase
            .from("topics")
            .upsert(
              { slug: topicSlug, label: topicSlug.replace(/-/g, " "), lifecycle: "emerging" },
              { onConflict: "slug" }
            )
            .select("id")
            .single();

          if (topic) {
            await supabase.from("topic_mentions").upsert(
              { content_id: content.id, topic_id: topic.id, confidence: 0.9 },
              { onConflict: "content_id,topic_id" }
            );
          }
        }

        if (item.source === "hackernews") results.hackernews++;
        else if (item.source === "reddit") results.reddit++;
        else if (item.source === "github") results.github++;
      } catch (e) {
        results.errors.push(`${item.title}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    }

    const mentionsLinked = await backfillCustomTopicMentions();
    const scoresUpdated = await recalculateAndPersistTrendScores();

    return NextResponse.json({
      message: "Ingestion complete",
      mentionsLinked,
      scoresUpdated,
      ...results,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ingestion failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/ingest",
    method: "POST",
    description: "Trigger data ingestion from HN, Reddit, and GitHub",
    configured: isSupabaseConfigured(),
  });
}
