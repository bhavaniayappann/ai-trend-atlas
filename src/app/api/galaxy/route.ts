import { getGalaxyData } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await getGalaxyData();
  return NextResponse.json(data);
}
