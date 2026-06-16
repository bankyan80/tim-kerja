import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { forcedSekolah } = await getSekolahFilter();
    const body = await req.json();
    const items = body.items || [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Tidak ada data" }, { status: 400 });
    }

    let imported = 0;
    for (const item of items) {
      const sekolah_id = forcedSekolah || item.sekolah_id;
      if (!sekolah_id || !item.jenis_dokumen || !item.tahun) continue;

      const existing = await queryOne(
        "SELECT id FROM arsip WHERE jenis_dokumen = ? AND sekolah_id = ? AND tahun = ? AND pemilik = ? AND deleted_at IS NULL",
        [item.jenis_dokumen, sekolah_id, String(item.tahun), item.pemilik || ""]
      );
      if (existing) continue;

      await execute(
        `INSERT INTO arsip (jenis_dokumen, sekolah_id, bulan, tahun, pemilik, file, file_name, versi) VALUES (?,?,?,?,?,?,?,?)`,
        [
          item.jenis_dokumen,
          sekolah_id,
          item.bulan || null,
          String(item.tahun),
          item.pemilik || "",
          item.file || "",
          item.file_name || "",
          1,
        ]
      );
      imported++;
    }

    return NextResponse.json({ ok: true, imported });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
