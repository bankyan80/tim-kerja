import { NextRequest, NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const { forcedSekolah } = await getSekolahFilter();
    const format = req.nextUrl.searchParams.get("format") || "csv";

    let sql = `SELECT a.id, a.jenis_dokumen, s.nama as sekolah_nama, a.bulan, a.tahun, a.pemilik, a.file_name, a.created_at as tanggal_upload
      FROM arsip a LEFT JOIN sekolah s ON s.id = a.sekolah_id WHERE a.deleted_at IS NULL ORDER BY a.created_at DESC`;
    const args: any[] = [];
    if (forcedSekolah) { sql = sql.replace("WHERE a.deleted_at IS NULL", "WHERE a.deleted_at IS NULL AND a.sekolah_id = ?"); args.push(forcedSekolah); }

    const rows = (await queryAll(sql, args)) as any[];

    if (format === "json") {
      return NextResponse.json(rows);
    }

    const headers = ["ID", "Jenis Dokumen", "Sekolah", "Bulan", "Tahun", "Pemilik", "Nama File", "Tanggal Upload"];
    const csvRows = rows.map((r) =>
      [
        r.id,
        r.jenis_dokumen,
        r.sekolah_nama || "",
        r.bulan || "",
        r.tahun,
        r.pemilik,
        r.file_name || "",
        r.tanggal_upload || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...csvRows].join("\r\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="arsip_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export gagal" }, { status: 500 });
  }
}
