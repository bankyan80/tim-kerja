import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";

export async function GET() {
  try {
    const rows = await queryAll("SELECT key, value FROM app_settings ORDER BY key");
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key as string] = row.value as string;
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await execute("INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')", [key, value as string]);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
