import { getRiverData } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await getRiverData();
  return NextResponse.json(data);
}
