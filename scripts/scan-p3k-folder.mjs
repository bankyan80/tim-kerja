import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const BASE = "C:\\Users\\Bank Yan\\OneDrive\\Documents\\BIODATA SIMPEG PNS-ASN P3K KEC LEMAHABANG (File responses)\\Data Scan P3K Lemahabang";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const PREFIX_MAP = {
  DATA_KELUARGA: "Kartu Keluarga",
  FOTO: "Pass Foto",
  PASS_FOTO: "Pass Foto",
  ID_DIRI: "KTP",
  IJAZAH_TRANSKIP: "Ijazah",
  IJAZAH: "Ijazah",
  LAINNYA: "Lainnya",
  SERDIK: "Sertifikat Pendidik",
  SERTIFIKAT: "Sertifikat Pendidik",
  SK_PPPK: "SK PPPK PW",
  SK_P3K: "SK PPPK PW",
  SPMT: "SK Penugasan",
};

const EXTRA_ALIASES = [
  ["IJAZAH", "Ijazah"],
  ["SERTI_PENDIDIK", "Sertifikat Pendidik"],
  ["SERTIFIKAT_PENDIDIK", "Sertifikat Pendidik"],
  ["SK_PENUGASAN", "SK Penugasan"],
];

function normalizeSchoolName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bsd\s*n\b/g, "")
    .replace(/\bsd\s*negeri\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchSchool(folderName, sekolahList) {
  const folderNorm = normalizeSchoolName(folderName);
  const folderParts = folderNorm.split(/\s+/).filter(Boolean);
  const folderNum = folderParts[0] || "";
  const folderLoc = folderParts.slice(1).join(" ");

  for (const s of sekolahList) {
    const dbNorm = normalizeSchoolName(s.nama);
    if (dbNorm === folderNorm) return s;
  }

  for (const s of sekolahList) {
    const dbNorm = normalizeSchoolName(s.nama);
    const dbParts = dbNorm.split(/\s+/).filter(Boolean);
    const dbNum = dbParts[0] || "";
    const dbLoc = dbParts.slice(1).join(" ");
    if (folderNum === dbNum && (dbLoc.includes(folderLoc) || folderLoc.includes(dbLoc))) {
      return s;
    }
  }

  return null;
}

function extractPegawaiName(folderName) {
  let name = folderName.split(",")[0].trim();
  if (name === folderName.trim()) {
    name = folderName.split("_")[0].trim();
  }
  return name;
}

function normalizeName(n) {
  return n.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
}

async function matchPegawai(name, sekolahId) {
  if (!name) return null;

  const rows = await client.execute(
    "SELECT id, nama FROM gtk WHERE sekolah_id = ? AND deleted_at IS NULL",
    [sekolahId]
  );
  const gtkList = rows.rows;
  if (gtkList.length === 0) return null;

  const nameNorm = normalizeName(name);

  for (const g of gtkList) {
    if (normalizeName(g.nama) === nameNorm) {
      return g;
    }
  }

  const nameParts = nameNorm.split(/\s+/).filter(Boolean);
  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    for (const g of gtkList) {
      const gtkNorm = normalizeName(g.nama);
      const gtkParts = gtkNorm.split(/\s+/).filter(Boolean);
      if (gtkParts.length >= 2 && gtkParts[0] === firstName && gtkParts[gtkParts.length - 1] === lastName) {
        return g;
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

function getFilePrefix(filename) {
  const idx = filename.indexOf("_");
  if (idx === -1) return null;
  return filename.substring(0, idx);
}

function normalizePrefix(prefix) {
  if (!prefix) return null;
  return prefix
    .replace(/^\d+\s*\.?\s*/i, "")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

function mapJenisDokumen(prefix) {
  if (!prefix) return null;

  const clean = prefix.replace(/^\d+\s*\.?\s*/i, "").trim();
  const norm = clean.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").toUpperCase();

  if (PREFIX_MAP[prefix]) return PREFIX_MAP[prefix];
  if (PREFIX_MAP[clean]) return PREFIX_MAP[clean];
  if (PREFIX_MAP[norm]) return PREFIX_MAP[norm];

  for (const [key, value] of EXTRA_ALIASES) {
    if (norm === key || clean.toUpperCase().includes(key)) return value;
  }

  const sortedKeys = Object.keys(PREFIX_MAP).sort((a, b) => a.length - b.length);
  for (const key of sortedKeys) {
    if (norm.includes(key) || key.includes(norm)) return PREFIX_MAP[key];
  }

  if (norm.includes("IJAZAH")) return "Ijazah";

  return null;
}

async function main() {
  console.log("=== Scan P3K Folder - Import to Arsip ===\n");

  const sekolahResult = await client.execute("SELECT id, nama FROM sekolah WHERE deleted_at IS NULL");
  const sekolahList = sekolahResult.rows;
  console.log(`Loaded ${sekolahList.length} sekolah from DB\n`);

  if (!existsSync(BASE)) {
    console.error(`ERROR: Base folder not found: ${BASE}`);
    process.exit(1);
  }

  const schoolFolders = readdirSync(BASE, { withFileTypes: true }).filter(d => d.isDirectory());
  console.log(`Found ${schoolFolders.length} school folders\n`);

  const stats = { imported: 0, duplicate: 0, noMatchPegawai: 0, noMatchJenis: 0, errors: 0 };

  for (const schoolFolder of schoolFolders) {
    const schoolFolderName = schoolFolder.name;
    const matchedSekolah = matchSchool(schoolFolderName, sekolahList);

    if (!matchedSekolah) {
      console.log(`Processing school: ${schoolFolderName} \u2192 NO MATCH (skipping)`);
      continue;
    }

    console.log(`Processing school: ${schoolFolderName} \u2192 matched ${matchedSekolah.nama}`);

    const schoolPath = join(BASE, schoolFolderName);
    const pegawaiFolders = readdirSync(schoolPath, { withFileTypes: true }).filter(d => d.isDirectory());

    for (const pegawaiFolder of pegawaiFolders) {
      const pegawaiFolderName = pegawaiFolder.name;
      const pegawaiName = extractPegawaiName(pegawaiFolderName);
      const matchedPegawai = await matchPegawai(pegawaiName, matchedSekolah.id);

      if (!matchedPegawai) {
        console.log(`  Processing pegawai: ${pegawaiFolderName} \u2192 NO MATCH (skipping)`);
        stats.noMatchPegawai++;
        continue;
      }

      console.log(`  Processing pegawai: ${pegawaiFolderName} \u2192 matched ${matchedPegawai.nama}`);

      const pegawaiPath = join(schoolPath, pegawaiFolderName);
      let files;
      try {
        files = readdirSync(pegawaiPath).filter(f => {
          const ext = extname(f).toLowerCase();
          return ext === ".pdf" || ext === ".jpg" || ext === ".jpeg" || ext === ".png";
        });
      } catch (err) {
        console.log(`    ERROR reading folder: ${err.message}`);
        stats.errors++;
        continue;
      }

      for (const file of files) {
        const prefix = getFilePrefix(file);
        const jenisDokumen = mapJenisDokumen(prefix);

        if (!jenisDokumen) {
          console.log(`    SKIPPED (no matching jenis dokumen): ${file}`);
          stats.noMatchJenis++;
          continue;
        }

        const dup = await client.execute(
          "SELECT id FROM arsip WHERE file_name = ? AND pemilik = ? AND jenis_dokumen = ? AND deleted_at IS NULL LIMIT 1",
          [file, matchedPegawai.nama, jenisDokumen]
        );

        if (dup.rows.length > 0) {
          console.log(`    SKIPPED (duplicate): ${file} \u2192 ${jenisDokumen}`);
          stats.duplicate++;
          continue;
        }

        try {
          const filePath = join(pegawaiPath, file);
          const buf = readFileSync(filePath);
          const base64 = buf.toString("base64");
          const mime = getMimeType(extname(file));
          const dataUrl = `data:${mime};base64,${base64}`;

          const now = new Date();
          const bulan = now.getMonth() + 1;
          const tahun = String(now.getFullYear());

          await client.execute(
            `INSERT INTO arsip (jenis_dokumen, sekolah_id, bulan, tahun, pemilik, file, file_name, versi)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              jenisDokumen,
              matchedSekolah.id,
              bulan,
              tahun,
              matchedPegawai.nama,
              dataUrl,
              file,
              1,
            ]
          );

          console.log(`    Importing: ${file} \u2192 ${jenisDokumen}`);
          stats.imported++;
        } catch (err) {
          console.log(`    ERROR importing: ${file} - ${err.message}`);
          stats.errors++;
        }
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total imported: ${stats.imported}`);
  console.log(`Total skipped (duplicate): ${stats.duplicate}`);
  console.log(`Total skipped (no match pegawai): ${stats.noMatchPegawai}`);
  console.log(`Total skipped (no match jenis): ${stats.noMatchJenis}`);
  console.log(`Errors: ${stats.errors}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
