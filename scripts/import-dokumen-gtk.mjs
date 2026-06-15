import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const BASE = "C:\\Users\\Bank Yan\\OneDrive\\Documents\\BIODATA SIMPEG PNS-ASN P3K KEC LEMAHABANG (File responses)";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const MAP_JENIS = {
  "DATA KELUARGA DIRI PDF (MAKS 2MB)": "Data Keluarga",
  "DOKUMEN KOMPETENSI PDF (MAKS 2MB)": "Dokumen Kompetensi",
  "DOKUMEN LAINNYA PDF (MAKS 2MB)": "Dokumen Lainnya",
  "IDENTITAS DIRI PDF (MAKS 2MB)": "Identitas Diri",
  "PASS FOTO (JPG-JPEG)": "Pass Foto",
  "SCAN IJAZAH+TRANSKRIP PDF (MAKS 1MB)": "Ijazah",
  "SCAN SK CPNS PDF (MAKS 1MB)": "SK CPNS",
  "SCAN SK JABATAN PDF (MAKS 2MB)": "SK Jabatan",
  "SCAN SK PANGKAT PDF (MAKS 1MB)": "SK Pangkat",
  "SCAN SK PNS-P3K PDF (MAKS 1MB)": "SK PNS/P3K",
  "SERTIFIKAT PELATIHAN-DIKLAT PDF (MAKS 2MB)": "Sertifikat Pelatihan",
  "SK KGB PDF (MAKS 1MB)": "SK KGB",
  "SKP-DP3 2021 PDF (MAKS 2MB)": "SKP",
  "BPJS KESEHATAN (File responses)": "BPJS Kesehatan",
  "IJAZAH (File responses)": "Ijazah",
  "KARTU KELUARGA (File responses)": "Kartu Keluarga",
  "KTP (File responses)": "KTP",
  "NPWP (File responses)": "NPWP",
  "PAS FOTO (PDH) (File responses)": "Pass Foto",
  "SERTIFIKAT PENDIDIK (File responses)": "Sertifikat Pendidik",
  "SK PENUGASAN (KEPSEK) (File responses)": "SK Penugasan",
  "SK PPPK PW (File responses)": "SK PPPK PW",
};

function normalizeName(n) {
  return n
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const PREFIXES = [
  "IDENTITAS DIRI", "IDENTITAS", "IDENTIAS",
  "IJAZAH", "IJAZAH DAN TRANSKIP NILAI", "IJAZAH TRANSKIP SI",
  "SK CPNS", "SK PNS", "SK PPPK", "SK P3K", "SK PANGKAT", "SK JABATAN", "SK JABFUNG", "SK KGB", "SK PEMBAGIAN TUGAS", "SK",
  "SPMT",
  "KELUARGA", "KGB",
  "DOKUMEN KOMPETENSI", "DOK KOMPETENSI", "DOK KOMP", "DOK_KOMP", "DOK_KOMPETENSI",
  "DOKUMEN LAINNYA", "LAINNYA",
  "SERTIFIKAT PENDIDIK", "SERTIFIKAT PELATIHAN", "SERTIFIKAT PPG",
  "PELDIKLAT", "PASS FOTO", "PAS FOTO", "FOTO",
  "NPWP KU",
  "SKP DP3", "SKP",
  "DATA KELUARGA DIRI",
];

function cleanPersonName(raw) {
  let n = raw.replace(/^[_\s,-]+/, "").replace(/[_\s,-]+$/, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  for (const p of PREFIXES) {
    const re = new RegExp("^" + p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s,_-]*", "i");
    n = n.replace(re, "").trim();
  }
  n = n.replace(/\s*\d+\s*$/, "").trim();
  n = n.replace(/[-.]+/g, " ").replace(/\s+/g, " ").trim();
  return n;
}

function extractNipName(filename) {
  let nip = "";
  let name = "";
  let beforeDash = "";
  let afterDash = "";
  let remainder = filename.replace(extname(filename), "");

  const nipMatch = remainder.match(/(\d{18})/);
  if (nipMatch) {
    nip = nipMatch[1];
    remainder = remainder.replace(nipMatch[0], "");
  }

  remainder = remainder
    .replace(/^[_\s-]+/, "")
    .replace(/[_\s-]+$/, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ");

  const dashIdx = remainder.indexOf(" - ");
  if (dashIdx >= 0) {
    beforeDash = remainder.substring(0, dashIdx).trim();
    afterDash = remainder.substring(dashIdx + 3).trim();
    beforeDash = cleanPersonName(beforeDash);
    afterDash = cleanPersonName(afterDash);
    name = afterDash || beforeDash || nip || filename;
  } else {
    name = cleanPersonName(remainder) || nip || filename;
  }

  return { nip, name, beforeDash, afterDash };
}

function normalizeNameNoSpace(s) {
  return normalizeName(s).replace(/\s+/g, "");
}

function isSchoolName(s) {
  return /\b(SDN?\b|TK|KB|PAUD|SMP|MI|RA|MTs|MA|SMK)/i.test(s) || /sekolah/i.test(s);
}

function isJunkName(s) {
  const junk = ["whatsapp", "image", "img", "edit", "removebg", "preview", "purple", "grey", "biru", "foto", "pas", "photo", "compressed", "merged", "dewek", "pdh", "warna", "biru"];
  const words = s.toLowerCase().split(/\s+/);
  return words.every(w => junk.includes(w) || /^\d+$/.test(w) || w.length < 3);
}

async function matchName(nameArr) {
  for (const candidate of nameArr) {
    if (!candidate || candidate.length < 2) continue;
    if (isJunkName(candidate)) continue;
    const cleanName = normalizeName(candidate);
    const nameParts = cleanName.split(/\s+/).filter(Boolean);
    if (nameParts.length === 0) continue;
    const firstWord = nameParts[0];
    const lastWord = nameParts[nameParts.length - 1];
    const cleanNameNoSpace = cleanName.replace(/\s+/g, "");

    const minLen = firstWord.length >= 2 ? firstWord.length : 3;
    if (minLen < 3) continue;

    const queryWords = [...new Set(nameParts.filter(w => w.length >= 2))];
    let bestRows = [];
    let bestQueryWord = "";

    for (const qWord of queryWords) {
      const rows = await client.execute(
        "SELECT * FROM gtk WHERE LOWER(nama) LIKE ? AND deleted_at IS NULL LIMIT 20",
        [`%${qWord}%`]
      );
      if (rows.rows.length > 0) {
        bestRows = rows.rows;
        bestQueryWord = qWord;
        if (rows.rows.length === 1) return rows.rows[0];
        if (qWord === firstWord) break;
      }
    }

    if (bestRows.length === 0) continue;

    if (bestRows.length === 1) return bestRows[0];

    const matchLast = bestRows.filter(r => {
      const gtkName = normalizeName(r.nama);
      return gtkName.includes(lastWord) || lastWord.includes(gtkName.split(/\s+/).pop());
    });
    if (matchLast.length === 1) return matchLast[0];
    if (matchLast.length > 1) {
      const exact = matchLast.filter(r => normalizeName(r.nama) === cleanName);
      if (exact.length === 1) return exact[0];
    }

    const matchSpaceAgnostic = bestRows.filter(r => {
      const gtkNoSpace = normalizeNameNoSpace(r.nama);
      return gtkNoSpace.includes(cleanNameNoSpace) || cleanNameNoSpace.includes(gtkNoSpace);
    });
    if (matchSpaceAgnostic.length === 1) return matchSpaceAgnostic[0];
    if (matchSpaceAgnostic.length > 1) {
      const exact = matchSpaceAgnostic.filter(r => normalizeNameNoSpace(r.nama) === cleanNameNoSpace);
      if (exact.length === 1) return exact[0];
    }

    const matchAnyWord = bestRows.filter(r => {
      const gtkName = normalizeName(r.nama);
      return nameParts.filter(w => w.length >= 3).some(w => gtkName.includes(w));
    });
    if (matchAnyWord.length === 1) return matchAnyWord[0];

    const longestWord = [...nameParts].sort((a, b) => b.length - a.length || 0)[0];
    if (longestWord && longestWord.length >= 5) {
      const byLongest = bestRows.filter(r => normalizeName(r.nama).includes(longestWord));
      if (byLongest.length === 1) return byLongest[0];
    }

    const spaceAgnosticRows = await client.execute(
      "SELECT * FROM gtk WHERE REPLACE(LOWER(nama), ' ', '') LIKE ? AND deleted_at IS NULL LIMIT 10",
      [`%${cleanNameNoSpace}%`]
    );
    if (spaceAgnosticRows.rows.length === 1) return spaceAgnosticRows.rows[0];
  }
  return null;
}

let allGtkCache = null;
async function getAllGtk() {
  if (!allGtkCache) {
    const r = await client.execute("SELECT * FROM gtk WHERE deleted_at IS NULL");
    allGtkCache = r.rows;
  }
  return allGtkCache;
}

function jaroWinkler(s1, s2) {
  if (s1 === s2) return 1;
  const len1 = s1.length, len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;
  const matchDist = Math.floor(Math.max(len1, len2) / 2) - 1;
  const matches1 = new Array(len1).fill(false);
  const matches2 = new Array(len2).fill(false);
  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(len2, i + matchDist + 1);
    for (let j = start; j < end; j++) {
      if (matches2[j]) continue;
      if (s1[i] !== s2[j]) continue;
      matches1[i] = true;
      matches2[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!matches1[i]) continue;
    while (!matches2[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, len1, len2); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

async function fallbackFuzzyMatch(nameArr) {
  const allGtk = await getAllGtk();
  let best = null;
  let bestScore = 0.7;
  for (const candidate of nameArr) {
    if (!candidate || candidate.length < 3) continue;
    if (isJunkName(candidate)) continue;
    const cleanName = normalizeName(candidate);
    const cleanNameNoSpace = cleanName.replace(/\s+/g, "");
    for (const gtk of allGtk) {
      const gtkName = normalizeName(gtk.nama);
      const gtkNoSpace = gtkName.replace(/\s+/g, "");
      let score = jaroWinkler(cleanName, gtkName);
      const noSpaceScore = jaroWinkler(cleanNameNoSpace, gtkNoSpace);
      if (noSpaceScore > score) score = noSpaceScore;
      if (gtkName.includes(cleanName) || cleanName.includes(gtkName)) score = Math.max(score, 0.9);
      if (gtkNoSpace.includes(cleanNameNoSpace) || cleanNameNoSpace.includes(gtkNoSpace)) score = Math.max(score, 0.85);
      if (score > bestScore) {
        bestScore = score;
        best = gtk;
      }
    }
  }
  return best;
}

async function matchGtk(nip, name, beforeDash, afterDash) {
  if (nip) {
    const rows = await client.execute("SELECT * FROM gtk WHERE nip = ? AND deleted_at IS NULL", [nip]);
    if (rows.rows.length > 0) return rows.rows[0];
    const rows2 = await client.execute("SELECT * FROM gtk WHERE nuptk = ? AND deleted_at IS NULL", [nip]);
    if (rows2.rows.length > 0) return rows2.rows[0];
    const rows3 = await client.execute("SELECT * FROM gtk WHERE nik = ? AND deleted_at IS NULL", [nip]);
    if (rows3.rows.length > 0) return rows3.rows[0];
  }

  let candidates = [];
  if (beforeDash && afterDash) {
    if (isSchoolName(afterDash)) {
      candidates = [beforeDash, name];
    } else {
      const afterResult = await matchName([afterDash]);
      if (afterResult) return afterResult;
      candidates = [beforeDash, name];
    }
  } else if (afterDash && isSchoolName(afterDash)) {
    candidates = [beforeDash, name];
  } else {
    candidates = [name, beforeDash, afterDash];
  }

  const result = await matchName(candidates);
  if (result) return result;

  const validCandidates = candidates.filter(c => c && c.length >= 3 && !isJunkName(c) && !isSchoolName(c));
  if (validCandidates.length === 0) return null;
  return await fallbackFuzzyMatch(validCandidates);
}

async function processFolder(folderPath, jenisDokumen, stats) {
  const files = readdirSync(folderPath).filter(f => {
    const ext = f.toLowerCase();
    return ext.endsWith(".pdf") || ext.endsWith(".jpg") || ext.endsWith(".jpeg") || ext.endsWith(".png");
  });
  for (const file of files) {
    const filePath = join(folderPath, file);
    const { nip, name, beforeDash, afterDash } = extractNipName(file);
    if (!nip && (!name || name.length < 2)) {
      console.log(`  SKIP (no identifier): ${file} [${jenisDokumen}]`);
      continue;
    }
    const gtk = await matchGtk(nip, name, beforeDash, afterDash);
    if (!gtk) {
      console.log(`  NO MATCH: ${file} (nip=${nip || "-"}, name=${name}) [${jenisDokumen}]`);
      stats.noMatch++;
      continue;
    }
    const dup = await client.execute(
      "SELECT id FROM arsip WHERE file_name = ? AND pemilik = ? AND jenis_dokumen = ? AND deleted_at IS NULL LIMIT 1",
      [file, gtk.nama, jenisDokumen]
    );
    if (dup.rows.length > 0) {
      console.log(`  SKIP (duplicate): ${file} [${jenisDokumen}]`);
      stats.skipped++;
      continue;
    }
    stats.imported++;
    const buf = readFileSync(filePath);
    const base64 = buf.toString("base64");
    const mime = extname(file).toLowerCase() === ".pdf" ? "application/pdf"
      : extname(file).toLowerCase() === ".png" ? "image/png"
      : "image/jpeg";
    const dataUrl = `data:${mime};base64,${base64}`;
    const now = new Date();
    await client.execute(
      `INSERT INTO arsip (sekolah_id, pemilik, jenis_dokumen, file, file_name, tahun, bulan, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [gtk.sekolah_id, gtk.nama, jenisDokumen, dataUrl, file, String(now.getFullYear()), now.getMonth() + 1]
    );
    console.log(`  IMPORT: ${file} -> ${gtk.nama} (${gtk.nip || gtk.nuptk || gtk.nik || "-"}) [${jenisDokumen}]`);
  }
}

async function main() {
  const folders = readdirSync(BASE, { withFileTypes: true }).filter(d => d.isDirectory());

  const stats = { imported: 0, skipped: 0, noMatch: 0 };
  const NESTED_FOLDERS = ["dokumen pppk paruh waktu"];

  for (const folder of folders) {
    if (NESTED_FOLDERS.includes(folder.name)) {
      const basePath = join(BASE, folder.name);
      const subFolders = readdirSync(basePath, { withFileTypes: true }).filter(d => d.isDirectory());
      for (const sub of subFolders) {
        const jenisDokumen = MAP_JENIS[sub.name] || "Dokumen GTK";
        const subPath = join(basePath, sub.name);
        await processFolder(subPath, jenisDokumen, stats);
      }
      continue;
    }

    const jenisDokumen = MAP_JENIS[folder.name] || "Dokumen GTK";
    const folderPath = join(BASE, folder.name);
    await processFolder(folderPath, jenisDokumen, stats);
  }

  const total = stats.imported + stats.noMatch + stats.skipped;
  console.log("\n=== SUMMARY ===");
  console.log(`Total files: ${total}`);
  console.log(`Imported: ${stats.imported}`);
  console.log(`No match: ${stats.noMatch}`);
  console.log(`Skipped (duplicate/no id): ${stats.skipped}`);
}

main().catch(console.error);
