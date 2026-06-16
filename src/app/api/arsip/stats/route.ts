import { NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";

export async function GET() {
  try {
    const { forcedSekolah } = await getSekolahFilter();
    let sql = "SELECT jenis_dokumen, COUNT(*) as count FROM arsip WHERE deleted_at IS NULL";
    const args: any[] = [];
    if (forcedSekolah) { sql += " AND sekolah_id = ?"; args.push(forcedSekolah); }
    sql += " GROUP BY jenis_dokumen ORDER BY count DESC";
    const byJenis = await queryAll(sql, args);

    let totalSql = "SELECT COUNT(*) as total FROM arsip WHERE deleted_at IS NULL";
    if (forcedSekolah) { totalSql += " AND sekolah_id = ?"; }
    const totalRow = await queryAll(totalSql, forcedSekolah ? [forcedSekolah] : []);

    return NextResponse.json({
      total: (totalRow[0] as any)?.total || 0,
      byJenis,
    });
  } catch {
    return NextResponse.json({ total: 0, byJenis: [] });
  }
}
