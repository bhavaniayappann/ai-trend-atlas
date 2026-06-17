import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { TrendRiver } from "@/components/river/TrendRiver";
import { getRiverData } from "@/lib/db/queries";

export default async function RiverPage() {
  const data = await getRiverData();

  return (
    <AppShell>
      <Header
        title="Trend River"
        description="Flowing visualization of how topics evolve over time"
      />
      <div className="flex-1">
        <TrendRiver data={data} />
      </div>
    </AppShell>
  );
}
