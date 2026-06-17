import { getTrendingTopics, getInsights, getStats } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const [trends, insights, stats] = await Promise.all([
    getTrendingTopics(12),
    getInsights(),
    getStats(),
  ]);

  return NextResponse.json({ trends, insights, stats });
}
