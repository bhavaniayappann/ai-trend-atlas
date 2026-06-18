import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/db/supabase";
import { recalculateAndPersistTrendScores, getComputedTrendScores } from "@/lib/db/trend-scores";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  }

  const { backfillCustomTopicMentions } = await import("@/lib/db/backfill");
  const mentionsLinked = await backfillCustomTopicMentions();
  const count = await recalculateAndPersistTrendScores();
  const scores = await getComputedTrendScores();

  return NextResponse.json({
    message: "Trend scores recalculated",
    mentionsLinked,
    count,
    scores,
  });
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ scores: [], configured: false });
  }

  const scores = await getComputedTrendScores();
  return NextResponse.json({ scores, configured: true });
}
