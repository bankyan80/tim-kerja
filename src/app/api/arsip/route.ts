import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { forcedSekolah } = await getSekolahFilter();
    const jenis = searchParams.get("jenis_dokumen");
    const sekolah_id = forcedSekolah || searchParams.get("sekolah_id");
    const id = searchParams.get("id");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    if (id) {
      const rows = await queryAll("SELECT * FROM arsip WHERE id = ? AND deleted_at IS NULL", [id]);
      if (rows.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
      const arsip = rows[0];
      const download = searchParams.get("download");
      const fileStr = arsip.file as string;
      if (download === "1" && fileStr) {
        const mime = fileStr.startsWith("data:application/pdf") ? "application/pdf"
          : fileStr.startsWith("data:image/png") ? "image/png"
          : fileStr.startsWith("data:image/jpeg") ? "image/jpeg"
          : "application/octet-stream";
        const base64 = fileStr.split(",")[1];
        const buf = Buffer.from(base64, "base64");
        return new NextResponse(buf, {
          headers: {
            "Content-Type": mime,
            "Content-Disposition": `attachment; filename="${(arsip.file_name as string) || "dokumen"}"`,
          },
        });
      }
      return NextResponse.json(arsip);
    }

    let sql = "SELECT a.id, a.jenis_dokumen, a.sekolah_id, a.bulan, a.tahun, a.pemilik, a.versi, a.created_at as tanggal_upload, a.file_name, s.nama as sekolah_nama FROM arsip a LEFT JOIN sekolah s ON s.id = a.sekolah_id WHERE a.deleted_at IS NULL";
    const args: any[] = [];
    if (jenis) { sql += " AND a.jenis_dokumen = ?"; args.push(jenis); }
    if (sekolah_id) { sql += " AND a.sekolah_id = ?"; args.push(sekolah_id); }
    sql += " ORDER BY a.created_at DESC";
    if (limit) { sql += " LIMIT ?"; args.push(Number(limit)); }
    if (offset) { sql += " OFFSET ?"; args.push(Number(offset)); }
    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { jenis_dokumen, sekolah_id, bulan, tahun, pemilik, file, versi, file_name } = b;
    await execute(`INSERT INTO arsip (jenis_dokumen, sekolah_id, bulan, tahun, pemilik, file, versi, file_name) VALUES (?,?,?,?,?,?,?,?)`, [jenis_dokumen, sekolah_id||null, bulan||null, tahun, pemilik, file||'', versi||1, file_name||'']);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const b = await req.json();
    const { id, ...fields } = b;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const setClauses: string[] = []; const args: any[] = [];
    for (const [k, v] of Object.entries(fields)) { setClauses.push(`${k} = ?`); args.push(v); }
    setClauses.push("updated_at = datetime('now')");
    args.push(id);
    await execute(`UPDATE arsip SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("UPDATE arsip SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
