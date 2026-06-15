import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "fs";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// === DATA FROM PORTAL-DINAS ===
// Extracted from src/data/sekolah.ts (all 44 schools)
const PORTAL_SEKOLAH = [
  // SD (22) - will skip existing
  { nama: 'SD NEGERI 1 ASEM', npsn: '20215216', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Abdurachman Saleh No. 328, Asem', desa: 'ASEM', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 BELAWA', npsn: '20215230', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cikuya 1, Belawa', desa: 'BELAWA', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 BELAWA', npsn: '20215564', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Inpres Blok A, Belawa', desa: 'BELAWA', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 CIPEUJEUH KULON', npsn: '20215287', status: 'NEGERI', akreditasi: 'B', address: 'Jl. K.H. Hasyim Asyari No. 07, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CIPEUJEUH KULON', npsn: '20215381', status: 'NEGERI', akreditasi: 'A', address: 'Jl. KH. Hasyim Asyari No. 500, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', dayaTampung: 60 },
  { nama: 'SD NEGERI 1 CIPEUJEUH WETAN', npsn: '20215286', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 62, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CIPEUJEUH WETAN', npsn: '20215380', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 3B, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', dayaTampung: 40 },
  { nama: 'SD NEGERI 3 CIPEUJEUH WETAN', npsn: '20214479', status: 'NEGERI', akreditasi: 'B', address: 'Jl. KH. Wahid Hasyim No. 66, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 LEMAHABANG', npsn: '20215162', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Ki Hajar Dewantoro No. 35, Lemahabang', desa: 'LEMAHABANG', dayaTampung: 40 },
  { nama: 'SD NEGERI 2 LEMAHABANG', npsn: '20214656', status: 'NEGERI', akreditasi: 'A', address: 'Jl. R.A. Kartini No. 26, Lemahabang', desa: 'LEMAHABANG', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 LEMAHABANG KULON', npsn: '20215161', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Syech Lemahabang No. 5, Lemahabang Kulon', desa: 'LEMAHABANG KULON', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 LEUWIDINGDING', npsn: '20215164', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Abdurahman Saleh, Leuwidingding', desa: 'LEUWIDINGDING', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 PICUNGPUGUR', npsn: '20246442', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Desa Picungpugur, Picungpugur', desa: 'PICUNGPUGUR', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 SARAJAYA', npsn: '20215517', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sarajaya No. 63, Sarajaya', desa: 'SARAJAYA', dayaTampung: 40 },
  { nama: 'SD NEGERI 2 SARAJAYA', npsn: '20214726', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sarajaya Subur No. 1, Sarajaya', desa: 'SARAJAYA', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 SIGONG', npsn: '20215506', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Pelita No. 101, Sigong', desa: 'SIGONG', dayaTampung: 80 },
  { nama: 'SD NEGERI 3 SIGONG', npsn: '20214570', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sigong, Sigong', desa: 'SIGONG', dayaTampung: 40 },
  { nama: 'SD NEGERI 4 SIGONG', npsn: '20244513', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cantilan, Sigong', desa: 'SIGONG', dayaTampung: 56 },
  { nama: 'SD NEGERI 1 SINDANGLAUT', npsn: '20215464', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Arief Rahman Hakim No. 24, Sindanglaut', desa: 'SINDANGLAUT', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 TUK KARANGSUWUNG', npsn: '20246445', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Pulo Undrus Ujung, Tuk Karangsuwung', desa: 'TUK KARANGSUWUNG', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 WANGKELANG', npsn: '20215584', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Wangkelang No. 40, Wangkelang', desa: 'WANGKELANG', dayaTampung: 56 },
  { nama: 'SD IT AL IRSYAD AL ISLAMIYYAH', npsn: '20215221', status: 'SWASTA', akreditasi: 'A', address: 'Jl. Syech Lemahabang No. 54, Lemahabang Kulon', desa: 'LEMAHABANG KULON', dayaTampung: 160 },

  // TK (8)
  { nama: 'TK NEGERI LEMAHABANG', npsn: '20270605', status: 'NEGERI', akreditasi: 'B', address: 'Jl. KH. Wakhid Hasyim, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', dayaTampung: 56 },
  { nama: 'TK AISYIYAH LEMAHABANG', npsn: '20254372', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Ki Hajar Dewantoro No. 25, Lemahabang', desa: 'LEMAHABANG', dayaTampung: 56 },
  { nama: 'TK AL-AQSO', npsn: '20254376', status: 'SWASTA', akreditasi: 'A', address: 'Jl. Desa Tuk Karangsuwung, Tuk Karangsuwung', desa: 'TUK KARANGSUWUNG', dayaTampung: 56 },
  { nama: 'TK AL-IRSYAD AL-ISLAMIYYAH', npsn: '20254373', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Syekh Lemahabang No. 54, Lemahabang Kulon', desa: 'LEMAHABANG KULON', dayaTampung: 56 },
  { nama: 'TK BPP KENANGA', npsn: '20254374', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Abdurahman Saleh No. 24, Asem', desa: 'ASEM', dayaTampung: 56 },
  { nama: 'TK GELATIK', npsn: '20254370', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Raya Dr. Wahidin No. 57A, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', dayaTampung: 56 },
  { nama: 'TK MELATI', npsn: '20254378', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Desa Wangkelang, Wangkelang', desa: 'WANGKELANG', dayaTampung: 56 },
  { nama: 'TK MUSLIMAT NU', npsn: '20254375', status: 'SWASTA', akreditasi: 'B', address: 'Jl. R.A. Kartini No. 5, Lemahabang', desa: 'LEMAHABANG', dayaTampung: 56 },

  // KB/PAUD (15)
  { nama: 'KB A.H. PLUS', npsn: '70039880', status: 'SWASTA', akreditasi: '-', address: 'Jl. Pelita Dusun 4, Sigong', desa: 'SIGONG', dayaTampung: 28 },
  { nama: 'KB AMALIA SALSABILA', npsn: '69804039', status: 'SWASTA', akreditasi: 'B', address: 'Jl. K.H. Hasyim Asyari No. 112, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', dayaTampung: 28 },
  { nama: 'KB AZ-ZAHRA', npsn: '69804068', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Pelita Dusun 02, Sigong', desa: 'SIGONG', dayaTampung: 28 },
  { nama: 'KB MUTIARA', npsn: '70044538', status: 'SWASTA', akreditasi: '-', address: 'Jl. KH. Hasyim Asyari No. 48, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', dayaTampung: 28 },
  { nama: 'KB PALAPA', npsn: '69870486', status: 'SWASTA', akreditasi: '-', address: 'Jl. Syech Lemahabang, Lemahabang Kulon', desa: 'LEMAHABANG KULON', dayaTampung: 28 },
  { nama: 'KB PERMATA BUNDA', npsn: '70024652', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Palasah Nunggal, Picungpugur', desa: 'PICUNGPUGUR', dayaTampung: 28 },
  { nama: 'PAUD AL HAMBRA', npsn: '69947715', status: 'SWASTA', akreditasi: 'C', address: 'Desa Lemahabang, Lemahabang', desa: 'LEMAHABANG', dayaTampung: 28 },
  { nama: 'PAUD AL-HIDAYAH', npsn: '69870488', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Cantilan, Sigong', desa: 'SIGONG', dayaTampung: 28 },
  { nama: 'PAUD AL-HUSNA', npsn: '69870479', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Mbah Ardisela Desa Asem, Asem', desa: 'ASEM', dayaTampung: 28 },
  { nama: 'PAUD AMANAH', npsn: '69870482', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Sidaresmi No. 1, Lemahabang Kulon', desa: 'LEMAHABANG KULON', dayaTampung: 28 },
  { nama: 'PAUD AN NAIM', npsn: '69870484', status: 'SWASTA', akreditasi: 'C', address: 'Blok Kliwon, Sindanglaut', desa: 'SINDANGLAUT', dayaTampung: 28 },
  { nama: 'PAUD ASY-SYAFIIYAH', npsn: '69870485', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Stasiun No. 15, Lemahabang Kulon', desa: 'LEMAHABANG KULON', dayaTampung: 28 },
  { nama: 'PAUD BUDGENVIL', npsn: '69870489', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Inpres, Belawa', desa: 'BELAWA', dayaTampung: 28 },
  { nama: 'PAUD TUNAS HARAPAN', npsn: '69870490', status: 'SWASTA', akreditasi: 'C', address: 'Blok Pahing, Wangkelang', desa: 'WANGKELANG', dayaTampung: 28 },
  { nama: 'PAUD SPS MELATI', npsn: '69804044', status: 'SWASTA', akreditasi: 'C', address: 'Dusun 02, Sarajaya', desa: 'SARAJAYA', dayaTampung: 28 },
];

// Canonical name mapping: alias -> canonical name
const PORTAL_CANONICAL: Record<string, string> = {
  "AH PLUS": "KB A.H. PLUS", "A.H. PLUS SIGONG": "KB A.H. PLUS", "AHE SIGONG": "KB A.H. PLUS", "PAUD A.H. PLUS": "KB A.H. PLUS", "PAUH A.H. PLUS": "KB A.H. PLUS",
  "AISYIYAH LEMAHABANG": "TK AISYIYAH LEMAHABANG", "TK AISYIYAH": "TK AISYIYAH LEMAHABANG", "TK AISYAH LEMHABANG": "TK AISYIYAH LEMAHABANG",
  "AL-HUSNA": "PAUD AL-HUSNA", "PAUD Al-Husna": "PAUD AL-HUSNA",
  "AL HAMBRA": "PAUD AL HAMBRA", "PAUD ALHAMBRA": "PAUD AL HAMBRA", "PAUD AL HAMBRA LEMAHABANG": "PAUD AL HAMBRA",
  "AMALIA SALSABILA": "KB AMALIA SALSABILA", "PAUD AMALIA SALSABIL": "KB AMALIA SALSABILA", "PAUD AMALIA SALSABILA": "KB AMALIA SALSABILA",
  "AMANAH": "PAUD AMANAH",
  "AN NAIM": "PAUD AN NAIM", "PAUD AN NAIM LEMAHABANG": "PAUD AN NAIM", "PAUD AN NAIM SINDANGLAUT": "PAUD AN NAIM", "PAUD ANIM": "PAUD AN NAIM", "PAUD AN-NAIM": "PAUD AN NAIM", "PAUD Al- Na'im": "PAUD AN NAIM",
  "ASY - SYAFIIYAH": "PAUD ASY-SYAFIIYAH", "ASY-SYAFIIYAH": "PAUD ASY-SYAFIIYAH",
  "AZ-ZAHRA": "KB AZ-ZAHRA", "PAUD KB. Az-Zahra": "KB AZ-ZAHRA", "RA AZ-ZAHRA": "KB AZ-ZAHRA", "RA AZZAHRA": "KB AZ-ZAHRA",
  "BPP KENANGA": "TK BPP KENANGA", "TK KENANGA": "TK BPP KENANGA", "TK BPP TERATAI": "TK BPP KENANGA",
  "BUDGENVIL": "PAUD BUDGENVIL", "PAUD BUDGENVILE": "PAUD BUDGENVIL", "PAUD BOUDGENVILE": "PAUD BUDGENVIL",
  "GELATIK": "TK GELATIK", "TK GELATIK LEMAHABANG": "TK GELATIK", "TK Gelatik": "TK GELATIK",
  "IT AL IRSYAD AL ISLAMIYYAH": "SD IT AL IRSYAD AL ISLAMIYYAH",
  "KB MUTIARA": "KB MUTIARA",
  "MELATI": "TK MELATI", "TK. Melati": "TK MELATI",
  "MUSLIMAT NU": "TK MUSLIMAT NU", "TK MUSLIMAT": "TK MUSLIMAT NU", "TK Musimat NU": "TK MUSLIMAT NU", "TK MUSLIMAT NU LEMAHABANG": "TK MUSLIMAT NU",
  "PALAPA": "KB PALAPA", "KB PALAPA LEMAHABANG": "KB PALAPA",
  "PAUD AL- HIDAYAH": "PAUD AL-HIDAYAH", "AL-HIDAYAH": "PAUD AL-HIDAYAH",
  "SPS MELATI": "PAUD SPS MELATI",
  "TUNAS HARAPAN": "PAUD TUNAS HARAPAN", "PAUD TUNASHARAPAN": "PAUD TUNAS HARAPAN", "PAUD TUNAS BANGSA": "PAUD TUNAS HARAPAN",
  "TK AL-AQSO": "TK AL-AQSO", "TK AL-AQSHO": "TK AL-AQSO", "TK Al Aqso": "TK AL-AQSO", "TK Al Aqsho": "TK AL-AQSO",
  "TK AL-IRSYAD AL-ISLAMIYYAH": "TK AL-IRSYAD AL-ISLAMIYYAH", "AL-IRSYAD AL-ISLAMIYYAH": "TK AL-IRSYAD AL-ISLAMIYYAH", "TKIT AL-IRSYAD AL-ISLAMIYYAH": "TK AL-IRSYAD AL-ISLAMIYYAH",
  "TK AISYIYAH LEMAHABANG": "TK AISYIYAH LEMAHABANG",
};

function readJSON(path: string) {
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

async function importSekolah() {
  console.log("\n=== Import Sekolah ===");
  const existing = await client.execute("SELECT npsn FROM sekolah");
  const existingNpsn = new Set(existing.rows.map((r: any) => r.npsn));

  const newSchools = PORTAL_SEKOLAH.filter((s: any) => !existingNpsn.has(s.npsn));
  console.log(`New schools to insert: ${newSchools.length}`);

  for (const s of newSchools) {
    await client.execute({
      sql: `INSERT INTO sekolah (npsn, nama, status, alamat, desa, kecamatan, kabupaten, akreditasi, jumlah_rombel, status_aktif, kode_pos, kepala_sekolah, nip_kepala_sekolah, operator, no_wa, email, latitude, longitude, foto)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [s.npsn, s.nama, s.status === 'NEGERI' ? 'negeri' : 'swasta', s.address || '', s.desa || '', 'Lemahabang', 'Kabupaten Cirebon', s.akreditasi || 'Belum', s.dayaTampung || 0, 'aktif', '45183', '', '', '', '', '', 0, 0, '']
    });
    console.log(`  + ${s.nama} (${s.npsn})`);
  }
}

async function importGTK() {
  console.log("\n=== Import GTK ===");

  const sekolahRows = await client.execute("SELECT id, npsn, nama FROM sekolah");
  const npsnToId = new Map<string, string>();
  for (const r of sekolahRows.rows) npsnToId.set(r.npsn as string, r.id as string);
  const namaToId = new Map<string, string>();
  for (const r of sekolahRows.rows) namaToId.set((r.nama as string).toLowerCase(), r.id as string);

  // Import TK/KB/PAUD pegawai from data-pegawai-tk.json (portal-dinas)
  const tkPath = "C:/Users/Bank Yan/portal-dinas/src/data/data-pegawai-tk.json";
  if (existsSync(tkPath)) {
    const data: any[] = readJSON(tkPath);
    let imported = 0;
    for (const p of data) {
      const schoolName = p.sekolah || "";
      // Lookup by npsn first, then by name
      let sekolahId = p.npsn ? npsnToId.get(String(p.npsn)) : undefined;
      if (!sekolahId) {
        const canonical = PORTAL_CANONICAL[schoolName];
        if (canonical) sekolahId = namaToId.get(canonical.toLowerCase());
        if (!sekolahId) sekolahId = namaToId.get(schoolName.toLowerCase());
      }
      if (!sekolahId) {
        console.log(`  SKIP pegawai: ${p.nama} -> unknown school: ${schoolName}`);
        continue;
      }
      try {
        await client.execute({
          sql: `INSERT OR IGNORE INTO gtk (nik, nip, nuptk, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, status_pegawai, jabatan, jenis_gtk, sekolah_id, pangkat_golongan, pendidikan_terakhir, sertifikasi, nrg, masa_kerja, tmt, nomor_sk, bup, kontak, status_aktif)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [String(p.nik || ""), p.nip || "", p.nuptk || "", p.nama, (p.jk || "L"), p.tempat_lahir || "", p.tanggal_lahir || "", p.status_kepegawaian || "Honorer", p.tugas_tambahan || "", p.jenis_ptk || "Guru", sekolahId, "", "", p.sertifikasi ? 1 : 0, "", 0, p.tmt || "", "", "", "", "aktif"]
        });
        imported++;
      } catch (e: any) { console.error(`  ERROR: ${p.nama} - ${e.message}`); }
    }
    console.log(`TK/KB pegawai imported: ${imported}`);
  }

  // Import SD IT AL IRSYAD AL ISLAMIYYAH pegawai from data-pegawai.json
  const sdPath = "C:/Users/Bank Yan/portal-dinas/src/data/data-pegawai.json";
  if (existsSync(sdPath)) {
    const data: any[] = readJSON(sdPath);
    const irsyadId = npsnToId.get("20215221");
    if (irsyadId) {
      let imported = 0;
      for (const p of data) {
        if (p.sekolah !== "SD IT AL IRSYAD AL ISLAMIYYAH") continue;
        try {
          await client.execute({
            sql: `INSERT OR IGNORE INTO gtk (nik, nip, nuptk, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, status_pegawai, jabatan, jenis_gtk, sekolah_id, pangkat_golongan, pendidikan_terakhir, sertifikasi, nrg, masa_kerja, tmt, nomor_sk, bup, kontak, status_aktif)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            args: [String(p.nik || ""), p.nip || "", p.nuptk || "", p.nama, (p.jk || "L"), p.tempat_lahir || "", p.tanggal_lahir || "", p.status_kepegawaian || "Honorer", p.tugas_tambahan || "", p.jenis_ptk || "Guru", irsyadId, "", "", p.sertifikasi ? 1 : 0, "", 0, p.tmt || "", "", "", "", "aktif"]
          });
          imported++;
        } catch (e: any) { console.error(`  ERROR: ${p.nama} - ${e.message}`); }
      }
      console.log(`SD IT AL IRSYAD pegawai imported: ${imported}`);
    }
  }
}

async function importSiswa() {
  console.log("\n=== Import Siswa ===");
  const siswaPath = "C:/Users/Bank Yan/portal-dinas/src/data/data-siswa.json";
  if (!existsSync(siswaPath)) { console.log("Siswa file not found"); return; }

  const data: any[] = readJSON(siswaPath);
  console.log(`Total records in file: ${data.length}`);

  const sekolahRows = await client.execute("SELECT id, npsn, nama FROM sekolah");
  const namaToId = new Map<string, string>();
  for (const r of sekolahRows.rows) namaToId.set((r.nama as string).toLowerCase(), r.id as string);
  const npsnToId = new Map<string, string>();
  for (const r of sekolahRows.rows) npsnToId.set(r.npsn as string, r.id as string);

  // Only import for TK/KB/PAUD + SD IT AL IRSYAD
  const newNpsns = ["20215221", "20254372", "20254376", "20254373", "20254374", "20254370", "20254378", "20254375",
    "70039880", "69804039", "69804068", "70044538", "69870486", "70024652", "69947715", "69870488",
    "69870479", "69870482", "69870484", "69870485", "69870489", "69870490", "69804044"];
  const newSchoolIds = new Set(newNpsns.map(n => npsnToId.get(n)).filter(Boolean));

  const KELAS_MAP: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };

  let imported = 0;
  let skippedNoSchool = 0;
  let skippedNotFound = 0;

  for (let i = 0; i < data.length; i++) {
    const s = data[i];
    const schoolName = (s.sekolah || "").trim();
    if (!schoolName) { skippedNoSchool++; continue; }

    let sekolahId: string | null = null;
    if (s.npsn) sekolahId = npsnToId.get(String(s.npsn)) || null;
    if (!sekolahId) {
      const canonical = PORTAL_CANONICAL[schoolName];
      if (canonical) sekolahId = namaToId.get(canonical.toLowerCase()) || null;
      if (!sekolahId) sekolahId = namaToId.get(schoolName.toLowerCase()) || null;
    }
    if (!sekolahId || !newSchoolIds.has(sekolahId)) { skippedNotFound++; continue; }

    const kelasNum = parseInt(s.kelas) || 1;
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO siswa (nik, nisn, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, alamat, nama_ayah, nama_ibu, nomor_kk, kelas, rombel, sekolah_id, tahun_pelajaran, status_siswa, tanggal_masuk, asal_sekolah, kebutuhan_khusus, kontak_orang_tua)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [String(s.nik || s.nik_asli || ""), String(s.nisn || ""), s.nama, (s.jk || "L"), (s.tempat_lahir || "").toUpperCase(), s.tanggal_lahir || "", s.agama || "Islam", s.alamat || "", s.data_ayah?.nama || "", s.data_ibu?.nama || "", "", KELAS_MAP[kelasNum] || "I", s.rombel || "", sekolahId, "2025/2026", "aktif", "", s.sekolah_asal || "", s.kebutuhan_khusus || "Tidak ada", ""]
      });
      imported++;
    } catch (e: any) { /* skip dupes */ }
    if (i % 1000 === 0) console.log(`  ${i}/${data.length} processed, ${imported} imported...`);
  }
  console.log(`Siswa imported: ${imported} (skipped no school: ${skippedNoSchool}, not new school: ${skippedNotFound})`);
}

async function main() {
  await importSekolah();
  await importGTK();
  await importSiswa();
  console.log("\n=== Import Complete ===");
  const r = await client.execute("SELECT 'sekolah' as t, count(*) as c FROM sekolah UNION ALL SELECT 'gtk', count(*) FROM gtk UNION ALL SELECT 'siswa', count(*) FROM siswa");
  for (const row of r.rows) console.log(row.t + ": " + row.c);
}
main().catch(console.error);
