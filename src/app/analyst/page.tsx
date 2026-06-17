import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { ChatPanel } from "@/components/analyst/ChatPanel";

export default function AnalystPage() {
  return (
    <AppShell>
      <Header
        title="AI Analyst"
        description="Ask questions about technology trends and get evidence-backed answers"
      />
      <div className="flex-1">
        <ChatPanel />
      </div>
    </AppShell>
  );
}
