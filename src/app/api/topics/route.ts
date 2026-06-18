import { NextResponse } from "next/server";
import { z } from "zod";
import { createTopic, listTopics } from "@/lib/db/topics";

const createSchema = z.object({
  label: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  keywords: z.array(z.string().min(1)).max(10).optional(),
});

export async function GET() {
  const topics = await listTopics();
  return NextResponse.json({ topics });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const topic = await createTopic(parsed.data);
    return NextResponse.json({ topic }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create topic" },
      { status: 500 }
    );
  }
}
