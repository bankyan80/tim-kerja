import { NextResponse } from "next/server";
import client from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await client.execute("SELECT * FROM users WHERE status = 'aktif' ORDER BY name");
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
