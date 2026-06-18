import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { TopicGalaxy } from "@/components/galaxy/TopicGalaxy";
import { getGalaxyData } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function GalaxyPage() {
  const data = await getGalaxyData();

  return (
    <AppShell>
      <Header
        title="Topic Galaxy"
        description="Your custom topics and how they relate"
      />
      <div className="flex-1">
        <TopicGalaxy data={data} />
      </div>
    </AppShell>
  );
}
