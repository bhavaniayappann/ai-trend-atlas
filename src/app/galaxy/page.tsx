import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { TopicGalaxy } from "@/components/galaxy/TopicGalaxy";
import { getGalaxyData } from "@/lib/db/queries";

export default async function GalaxyPage() {
  const data = await getGalaxyData();

  return (
    <AppShell>
      <Header
        title="Topic Galaxy"
        description="Interactive map of technology trends and their relationships"
      />
      <div className="flex-1">
        <TopicGalaxy data={data} />
      </div>
    </AppShell>
  );
}
