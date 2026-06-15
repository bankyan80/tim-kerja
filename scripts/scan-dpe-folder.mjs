import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";

const BASE = "C:\\Users\\Bank Yan\\OneDrive\\Documents\\BIODATA SIMPEG PNS-ASN P3K KEC LEMAHABANG (File responses)\\SCAN DPE";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const JENIS_MAP = [
  { pattern: /^[\d\s\.]*\s*(npwp|npwp\s*\d)/i, jenis: "NPWP" },
  { pattern: /^[\d\s\.]*\s*(ktp|ktp\s*\d)/i, jenis: "KTP" },
  { pattern: /^[\d\s\.]*\s*(karpeg|kartu\s*pegawai)/i, jenis: "Kartu Pegawai" },
  { pattern: /^[\d\s\.]*\s*(sk\s*cpns|cpns)/i, jenis: "SK CPNS" },
  { pattern: /^[\d\s\.]*\s*sk\s*pns/i, jenis: "SK PNS" },
  { pattern: /^[\d\s\.]*\s*(sk\s*jafung|sk\s*jabatan\s*fungsional|jafung)/i, jenis: "SK Jafung" },
  { pattern: /^[\d\s\.]*\s*(sk\s*pangkat|sk\s*kenaikan\s*pangkat|sk\s*gol|pangkat)/i, jenis: "SK Pangkat" },
  { pattern: /^[\d\s\.]*\s*(sk\s*konversi|konversi\s*nip)/i, jenis: "SK Konversi" },
  { pattern: /^[\d\s\.]*\s*(sk\s*mutasi)/i, jenis: "SK Mutasi" },
  { pattern: /^[\d\s\.]*\s*sk\s*(terakhir|\d)/i, jenis: "SK" },
  { pattern: /^[\d\s\.]*\s*(ijazah|ijazah\s*\d|ijazah\s*s1|ijazah\s*terakhir)/i, jenis: "Ijazah" },
  { pattern: /^[\d\s\.]*\s*(transkrip|transkip|transkrip\s*nilai)/i, jenis: "Transkrip Nilai" },
  { pattern: /^[\d\s\.]*\s*(akta|akta\s*iv|akta\s*\d)/i, jenis: "Akta" },
  { pattern: /^[\d\s\.]*\s*(sertifikat\s*pendidik|serdik)/i, jenis: "Sertifikat Pendidik" },
  { pattern: /^[\d\s\.]*\s*(foto|pas\s*foto)/i, jenis: "Pass Foto" },
  { pattern: /^[\d\s\.]*\s*(kk|kartu\s*keluarga)/i, jenis: "Kartu Keluarga" },
  { pattern: /^[\d\s\.]*\s*(bpjs)/i, jenis: "BPJS Kesehatan" },
  { pattern: /^[\d\s\.]*\s*(buku\s*nikah)/i, jenis: "Buku Nikah" },
  { pattern: /^[\d\s\.]*\s*(spmt)/i, jenis: "SK Penugasan" },
  { pattern: /^[\d\s\.]*\s*(sk\s*pppk|sk\s*p3k)/i, jenis: "SK PPPK PW" },
  { pattern: /^[\d\s\.]*\s*(data_keluarga|data\s*keluarga)/i, jenis: "Kartu Keluarga" },
  { pattern: /^[\d\s\.]*\s*(id_diri|id\s*diri)/i, jenis: "KTP" },
  { pattern: /^[\d\s\.]*\s*(pas\s*foto|pass\s*foto)/i, jenis: "Pass Foto" },
  { pattern: /^[\d\s\.]*\s*(sertifikat|sertifikat\s*ppl)/i, jenis: "Sertifikat" },
  { pattern: /^[\d\s\.]*\s*(pns|sk\s*pns)/i, jenis: "SK PNS" },
  { pattern: /^[\d\s\.]*\s*(lainnya|lainnya_skbm)/i, jenis: "Lainnya" },
  { pattern: /^[\d\s\.]*\s*(sttpl|sertifikat\s*pelatihan)/i, jenis: "Sertifikat" },
];

const UNCLEAN_FOLDERS = [
  "scanbutitintkgelatik", "data guru belawa 2", "lainnya", "berkas",
  "temp", "new folder", "rename", "scan data elektronik",
];
const UNCLEAN_PATTERNS = [
  /^berkas/i, /^data\s*(guru|pegawai)/i, /^scan\s*(data|dokumen|sk)/i,
  /^file\s*scan/i, /^dokumen\s*elektronik/i,
];

function isUncleanFolder(name) {
  const n = name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (UNCLEAN_FOLDERS.some(u => n.includes(u))) return true;
  if (UNCLEAN_PATTERNS.some(p => p.test(n))) return true;
  return false;
}

function extractPegawaiName(folderName) {
  let name = folderName
    .replace(/^(PAK|BU|PA|BAPAK|IBU)\s+/i, "")
    .replace(/\s*-\s*SD.*$/i, "")
    .replace(/\s*[-_]\s*(SD|TK|KB|PAUD)\b.*$/i, "")
    .replace(/\s*\(.*\)/g, "")
    .trim();
  if (name.includes(",")) name = name.split(",")[0].trim();
  return name;
}

function normalizeName(n) {
  return n.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
}

async function matchPegawai(name) {
  if (!name) return null;
  const rows = await client.execute("SELECT id, nama, sekolah_id FROM gtk WHERE deleted_at IS NULL ORDER BY LENGTH(nama) DESC");
  const gtkList = rows.rows;
  if (gtkList.length === 0) return null;

  const norm = normalizeName(name);
  if (!norm) return null;
  const normParts = norm.split(/\s+/).filter(Boolean);

  for (const g of gtkList) {
    if (normalizeName(g.nama) === norm) return g;
  }

  if (normParts.length >= 2) {
    const first = normParts[0];
    const last = normParts[normParts.length - 1];
    for (const g of gtkList) {
      const gn = normalizeName(g.nama);
      const gp = gn.split(/\s+/).filter(Boolean);
      if (gp.length >= 2 && gp[0] === first && gp[gp.length - 1] === last) return g;
    }
  }

  for (const g of gtkList) {
    const gn = normalizeName(g.nama);
    if (norm.startsWith(gn) || gn.startsWith(norm)) return g;
  }

  // multi-word phrase match (2+ consecutive words, minimum 5 chars per word)
  if (normParts.length >= 2) {
    for (let len = Math.min(2, normParts.length); len >= 2; len--) {
      for (let i = 0; i <= normParts.length - len; i++) {
        const phrase = normParts.slice(i, i + len).join(" ");
        if (phrase.length < 5) continue;
        for (const g of gtkList) {
          const gn = normalizeName(g.nama);
          if (gn.includes(phrase)) return g;
        }
      }
    }
  }

  return null;
}

function getMimeType(ext) {
  const e = ext.toLowerCase();
  if (e === ".pdf") return "application/pdf";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".png") return "image/png";
  return "application/octet-stream";
}

function detectJenisDokumen(filename) {
  const name = basename(filename, extname(filename));

  const mergedMatch = name.match(/^(KTP|NPWP|BPJS|KK|BUKU\s*REKENING|AKTA)/i);
  if (mergedMatch) {
    const rest = name.replace(mergedMatch[0], "");
    if (rest.includes(",") || rest.includes("+") || rest.includes("_")) {
      const types = name.split(/[,+_]/).filter(Boolean);
      const known = types.filter(t => JENIS_MAP.some(j => j.pattern.test(t.trim())));
      if (known.length >= 2) return null;
    }
  }

  for (const { pattern, jenis } of JENIS_MAP) {
    if (pattern.test(name)) return jenis;
  }

  return null;
}

function shouldSkipFile(filename) {
  const name = basename(filename, extname(filename));
  const skipPatterns = [
    /^skbm/i, /^sk\s*pembagian/i, /^(diklat|pelatihan)/i,
    /^(IMG_|WhatsApp|Signal|Telegram)/i, /^(temp|tmp)/i,
    /^(scan\s*\d{8})/i,
  ];
  return skipPatterns.some(p => p.test(name));
}

async function main() {
  console.log("=== SCAN DPE - Import to Arsip ===\n");
  if (!existsSync(BASE)) { console.error("ERROR: Base folder not found"); process.exit(1); }

  const allFiles = [];
  const seenFolders = new Set();
  function walk(dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if ([".pdf", ".jpg", ".jpeg", ".png"].includes(extname(e.name).toLowerCase())) {
        allFiles.push(full);
        seenFolders.add(basename(dirname(full)));
      }
    }
  }
  walk(BASE);
  console.log(`Found ${allFiles.length} files\n`);

  const stats = { imported: 0, duplicate: 0, noMatchPegawai: 0, noMatchJenis: 0, skipped: 0, errors: 0 };

  for (const filePath of allFiles) {
    const filename = basename(filePath);
    const parentDir = basename(dirname(filePath));

    if (isUncleanFolder(parentDir)) {
      console.log(`  SKIPPED (unclean folder): ${filename} (in: ${parentDir})`);
      stats.skipped++;
      continue;
    }

    let pegawaiName = extractPegawaiName(parentDir);
    if (!pegawaiName || pegawaiName.length < 3) {
      const grandparent = basename(dirname(dirname(filePath)));
      if (!isUncleanFolder(grandparent)) pegawaiName = extractPegawaiName(grandparent);
    }

    if (shouldSkipFile(filename)) {
      console.log(`  SKIPPED (ignored file type): ${filename}`);
      stats.skipped++;
      continue;
    }

    const jenisDokumen = detectJenisDokumen(filename);
    if (!jenisDokumen) {
      console.log(`  SKIPPED (no matching jenis): ${filename} (from: ${parentDir})`);
      stats.noMatchJenis++;
      continue;
    }

    const matchedPegawai = await matchPegawai(pegawaiName);
    if (!matchedPegawai) {
      console.log(`  SKIPPED (pegawai not found): ${filename} (owner: ${pegawaiName || parentDir})`);
      stats.noMatchPegawai++;
      continue;
    }

    const dup = await client.execute(
      "SELECT id FROM arsip WHERE file_name = ? AND pemilik = ? AND jenis_dokumen = ? AND deleted_at IS NULL LIMIT 1",
      [filename, matchedPegawai.nama, jenisDokumen]
    );
    if (dup.rows.length > 0) {
      console.log(`  SKIPPED (duplicate): ${filename} (${matchedPegawai.nama})`);
      stats.duplicate++;
      continue;
    }

    try {
      const buf = readFileSync(filePath);
      const base64 = buf.toString("base64");
      const mime = getMimeType(extname(filename));
      const dataUrl = `data:${mime};base64,${base64}`;
      const now = new Date();
      await client.execute(
        `INSERT INTO arsip (jenis_dokumen, sekolah_id, bulan, tahun, pemilik, file, file_name, versi)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [jenisDokumen, matchedPegawai.sekolah_id, now.getMonth() + 1, String(now.getFullYear()), matchedPegawai.nama, dataUrl, filename, 1]
      );
      console.log(`  Imported: ${filename} → ${jenisDokumen} (${matchedPegawai.nama})`);
      stats.imported++;
    } catch (err) {
      console.log(`  ERROR: ${filename} - ${err.message}`);
      stats.errors++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Imported: ${stats.imported}`);
  console.log(`Duplicate: ${stats.duplicate}`);
  console.log(`No match pegawai: ${stats.noMatchPegawai}`);
  console.log(`No match jenis: ${stats.noMatchJenis}`);
  console.log(`Skipped (unclean/ignored): ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
