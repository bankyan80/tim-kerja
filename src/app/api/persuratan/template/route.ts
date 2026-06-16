import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import type { ResultSet } from "@libsql/client";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jenis = searchParams.get("jenis");
    const status = searchParams.get("status");

    let sql = "SELECT * FROM template_surat WHERE deleted_at IS NULL";
    const args: string[] = [];

    if (jenis) { sql += " AND jenis = ?"; args.push(jenis); }
    if (status) { sql += " AND status = ?"; args.push(status); }

    sql += " ORDER BY created_at DESC";

    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { nama, jenis, deskripsi, isi_template, status } = body;

    if (!nama || !jenis) {
      return NextResponse.json({ error: "Nama dan jenis wajib diisi" }, { status: 400 });
    }

    const result = (await execute(
      "INSERT INTO template_surat (nama, jenis, deskripsi, isi_template, status) VALUES (?, ?, ?, ?, ?)",
      [nama, jenis, deskripsi || "", isi_template || "", status || "aktif"]
    )) as ResultSet;

    const newId = result.lastInsertRowid?.toString() || "";
    return NextResponse.json({ id: newId, success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan template" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { id, nama, jenis, deskripsi, isi_template, status } = body;

    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    await execute(
      "UPDATE template_surat SET nama = ?, jenis = ?, deskripsi = ?, isi_template = ?, status = ?, updated_at = datetime('now') WHERE id = ?",
      [nama, jenis, deskripsi || "", isi_template || "", status || "aktif", id]
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    await execute("UPDATE template_surat SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus template" }, { status: 500 });
  }
}
