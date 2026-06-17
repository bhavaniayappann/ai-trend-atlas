import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { TrendCard } from "@/components/dashboard/TrendCard";
import { InsightFeed } from "@/components/dashboard/InsightFeed";
import { getTrendingTopics, getInsights, getStats } from "@/lib/db/queries";

export default async function DashboardPage() {
  const [trends, insights, stats] = await Promise.all([
    getTrendingTopics(8),
    getInsights(),
    getStats(),
  ]);

  return (
    <AppShell>
      <Header
        title="Dashboard"
        description="Real-time overview of emerging technology trends"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <StatsBar stats={stats} />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Top Trending Topics
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {trends.map((trend, i) => (
                <TrendCard key={trend.topic_slug} trend={trend} rank={i + 1} />
              ))}
            </div>
          </div>

          <div>
            <InsightFeed insights={insights} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
