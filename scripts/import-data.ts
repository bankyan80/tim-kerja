import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const KELAS_MAP: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };

async function batchInsert(table: string, rows: any[], fields: string[], chunkSize = 200) {
  if (rows.length === 0) return;
  const ph = fields.map(() => "?").join(", ");
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = chunk.map(() => `(${ph})`).join(", ");
    const sql = `INSERT OR IGNORE INTO ${table} (${fields.join(", ")}) VALUES ${values}`;
    const args = chunk.flatMap((row) => fields.map((f) => (row as any)[f] ?? null));
    try { await client.execute({ sql, args }); }
    catch (e: any) { console.error("Insert error:", e.message.slice(0, 100)); }
  }
}

function readJSON(path: string) {
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

async function importSekolah() {
  console.log("Importing sekolah...");
  const data: any[] = readJSON("data-sekolah.json");
  const rows = data.map((s: any) => ({
    npsn: s.npsn,
    nama: s.nama,
    status: s.status === "NEGERI" ? "negeri" : "swasta",
    alamat: s.address || "",
    desa: s.desa || "",
    kecamatan: "Lemahabang",
    kabupaten: "Kabupaten Cirebon",
    akreditasi: s.akreditasi || "Belum",
    jumlah_rombel: s.dayaTampung || 0,
    status_aktif: "aktif",
    kode_pos: "45183",
    kepala_sekolah: "",
    nip_kepala_sekolah: "",
    operator: "",
    no_wa: "",
    email: "",
    latitude: 0,
    longitude: 0,
    foto: "",
  }));
  await batchInsert("sekolah", rows, ["npsn","nama","status","alamat","desa","kecamatan","kabupaten","akreditasi","jumlah_rombel","status_aktif","kode_pos","kepala_sekolah","nip_kepala_sekolah","operator","no_wa","email","latitude","longitude","foto"]);
  console.log(`  ${rows.length} sekolah imported`);
}

async function importGTK() {
  console.log("Importing GTK...");
  const data: any[] = readJSON("data-pegawai.json");
  const sekolahMap = new Map<string, string>();
  const sekolahRows = await client.execute("SELECT id, nama FROM sekolah");
  for (const r of sekolahRows.rows) sekolahMap.set((r.nama as string).toLowerCase(), r.id as string);

  const rows = data.map((p: any) => {
    const sekolahNama = (p.sekolah || "").toLowerCase();
    const sekolahId = sekolahMap.get(sekolahNama) || "";
    return {
      nik: String(p.nik || ""),
      nip: p.nip || "",
      nuptk: p.nuptk || "",
      nama: p.nama,
      jenis_kelamin: (p.jk || "L") as string,
      tempat_lahir: p.tempat_lahir || "",
      tanggal_lahir: p.tanggal_lahir || "",
      status_pegawai: (p.status_kepegawaian || "Honorer") as string,
      jabatan: p.tugas_tambahan || "",
      jenis_gtk: (p.jenis_ptk || "Guru") as string,
      sekolah_id: sekolahId || "",
      pangkat_golongan: "",
      pendidikan_terakhir: "",
      sertifikasi: p.sertifikasi ? 1 : 0,
      nrg: "",
      masa_kerja: 0,
      tmt: p.tmt || "",
      nomor_sk: "",
      bup: "",
      kontak: "",
      status_aktif: "aktif",
    };
  });
  await batchInsert("gtk", rows, ["nik","nip","nuptk","nama","jenis_kelamin","tempat_lahir","tanggal_lahir","status_pegawai","jabatan","jenis_gtk","sekolah_id","pangkat_golongan","pendidikan_terakhir","sertifikasi","nrg","masa_kerja","tmt","nomor_sk","bup","kontak","status_aktif"]);
  console.log(`  ${rows.length} GTK imported`);
}

async function importSiswa() {
  console.log("Importing siswa...");
  const data: any[] = readJSON("data-siswa.json");
  const sekolahMap = new Map<string, string>();
  const sekolahRows = await client.execute("SELECT id, npsn FROM sekolah");
  for (const r of sekolahRows.rows) sekolahMap.set(r.npsn as string, r.id as string);

  let imported = 0;
  const BATCH = 500;
  for (let i = 0; i < data.length; i += BATCH) {
    const batch = data.slice(i, i + BATCH);
    const rows = batch.map((s: any) => {
      const npsn = String(s.npsn || "");
      const kelasNum = parseInt(s.kelas) || 1;
      return {
        nik: String(s.nik || s.nik_asli || ""),
        nisn: String(s.nisn || ""),
        nama_lengkap: s.nama,
        jenis_kelamin: (s.jk || "L") as string,
        tempat_lahir: (s.tempat_lahir || "").toUpperCase(),
        tanggal_lahir: s.tanggal_lahir || "",
        agama: s.agama || "Islam",
        alamat: s.alamat || "",
        nama_ayah: s.data_ayah?.nama || "",
        nama_ibu: s.data_ibu?.nama || "",
        nomor_kk: "",
        kelas: KELAS_MAP[kelasNum] || "I",
        rombel: s.rombel || "",
        sekolah_id: sekolahMap.get(npsn) || "",
        tahun_pelajaran: "2025/2026",
        status_siswa: "aktif",
        tanggal_masuk: "",
        asal_sekolah: s.sekolah_asal || "",
        kebutuhan_khusus: s.kebutuhan_khusus || "Tidak ada",
        kontak_orang_tua: "",
      };
    });
    await batchInsert("siswa", rows, ["nik","nisn","nama_lengkap","jenis_kelamin","tempat_lahir","tanggal_lahir","agama","alamat","nama_ayah","nama_ibu","nomor_kk","kelas","rombel","sekolah_id","tahun_pelajaran","status_siswa","tanggal_masuk","asal_sekolah","kebutuhan_khusus","kontak_orang_tua"]);
    imported += rows.length;
    if ((i / BATCH) % 10 === 0) console.log(`  ${imported}/${data.length} siswa...`);
  }
  console.log(`  ${imported} siswa imported`);
}

async function main() {
  console.log("Starting import...\n");
  await importSekolah();
  await importGTK();
  await importSiswa();
  console.log("\nImport complete!");
}

main().catch(console.error);
