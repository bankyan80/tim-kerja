import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jenis = searchParams.get("jenis");
    const status = searchParams.get("status");
    let sql = "SELECT * FROM surat WHERE deleted_at IS NULL";
    const args: any[] = [];
    if (jenis) { sql += " AND jenis = ?"; args.push(jenis); }
    if (status) { sql += " AND status = ?"; args.push(status); }
    sql += " ORDER BY tanggal_surat DESC";
    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const { nomor_agenda, nomor_surat, tanggal_surat, tanggal_diterima, asal_surat, tujuan, perihal, klasifikasi, jenis, file, disposisi, penerima_disposisi, batas_tindak_lanjut, penandatangan, isi_surat, lampiran, file_final, status_pengiriman, tanggal_kirim, status, catatan } = b;
    await execute(`INSERT INTO surat (nomor_agenda, nomor_surat, tanggal_surat, tanggal_diterima, asal_surat, tujuan, perihal, klasifikasi, jenis, file, disposisi, penerima_disposisi, batas_tindak_lanjut, penandatangan, isi_surat, lampiran, file_final, status_pengiriman, tanggal_kirim, status, catatan) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [nomor_agenda||'', nomor_surat, tanggal_surat||'', tanggal_diterima||'', asal_surat||'', tujuan||'', perihal, klasifikasi||'', jenis||'masuk', file||'', disposisi||'', penerima_disposisi||'', batas_tindak_lanjut||'', penandatangan||'', isi_surat||'', lampiran||'', file_final||'', status_pengiriman||'', tanggal_kirim||'', status||'draft', catatan||'']);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const { id, ...fields } = b;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const setClauses: string[] = []; const args: any[] = [];
    for (const [k, v] of Object.entries(fields)) { setClauses.push(`${k} = ?`); args.push(v); }
    setClauses.push("updated_at = datetime('now')");
    args.push(id);
    await execute(`UPDATE surat SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("UPDATE surat SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
