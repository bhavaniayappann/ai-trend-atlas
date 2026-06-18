import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { TrendRiver } from "@/components/river/TrendRiver";
import { getRiverData } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function RiverPage() {
  const data = await getRiverData();

  return (
    <AppShell>
      <Header
        title="Trend River"
        description="Mention volume over time for your tracked topics"
      />
      <div className="flex-1">
        <TrendRiver data={data} />
      </div>
    </AppShell>
  );
}
