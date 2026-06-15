import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.TURSO_DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const { rows } = await client.execute("SELECT id, name, email, role, status FROM users WHERE status = 'aktif' ORDER BY name");
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
