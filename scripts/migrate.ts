import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const stmts = [
  "CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('nama_aplikasi', 'Sistem Informasi Kecamatan Lemahabang')",
  "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('instansi', 'Kecamatan Lemahabang')",
  "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('wilayah', 'Kecamatan Lemahabang, Kabupaten Cirebon')",
  "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('logo', '')",
  "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('tahun_pelajaran', '2025/2026')",
  "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('format_nomor_surat', '{nomor}/SURAT/{bulan_romawi}/{tahun}')",
  "CREATE TABLE IF NOT EXISTS user_profiles (user_id TEXT PRIMARY KEY REFERENCES users(id), foto TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
];

async function main() {
  for (const sql of stmts) {
    try {
      await client.execute(sql);
      console.log("OK:", sql.substring(0, 60));
    } catch (e: any) {
      console.error("FAIL:", e.message);
    }
  }
  console.log("Done");
}

main().catch(console.error);
