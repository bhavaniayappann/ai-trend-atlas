import { buildRAGContext, createAnalystStream } from "@/lib/ai/rag";
import { convertToModelMessages, type UIMessage } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const lastMessage = messages[messages.length - 1];
  const query =
    lastMessage?.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ") ?? "";

  const context = await buildRAGContext(query);
  const result = await createAnalystStream(query, context, messages);

  return result.toUIMessageStreamResponse();
}
