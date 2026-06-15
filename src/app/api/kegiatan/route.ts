import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";

export async function GET() {
  try {
    const rows = await queryAll("SELECT * FROM kegiatan WHERE deleted_at IS NULL ORDER BY tanggal DESC");
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { nama, kategori, tanggal, waktu, tempat, peserta, penanggung_jawab, undangan, daftar_hadir, notulen, dokumentasi, biaya, laporan } = b;
    await execute(`INSERT INTO kegiatan (nama, kategori, tanggal, waktu, tempat, peserta, penanggung_jawab, undangan, daftar_hadir, notulen, dokumentasi, biaya, laporan) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [nama, kategori||'Lainnya', tanggal||'', waktu||'', tempat||'', peserta||'', penanggung_jawab||'', undangan||'', daftar_hadir||'', notulen||'', dokumentasi||'', biaya||0, laporan||'']);
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
    await execute(`UPDATE kegiatan SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("UPDATE kegiatan SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
