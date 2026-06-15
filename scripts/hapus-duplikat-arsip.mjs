import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Fetch all non-deleted records
const all = await client.execute(
  "SELECT id, file_name, pemilik, jenis_dokumen, created_at FROM arsip WHERE deleted_at IS NULL ORDER BY created_at ASC"
);
console.log(`Total records: ${all.rows.length}`);

// Group by (file_name, pemilik, jenis_dokumen), keep first (earliest created_at)
const groups = new Map();
for (const row of all.rows) {
  const key = `${row.file_name}|${row.pemilik}|${row.jenis_dokumen}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row.id);
}

const toDelete = [];
for (const [key, ids] of groups) {
  if (ids.length > 1) {
    // First ID is the earliest (since ordered ASC), rest are duplicates
    toDelete.push(...ids.slice(1));
  }
}

console.log(`Found ${toDelete.length} duplicate IDs to delete`);

if (toDelete.length > 0) {
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100);
    const placeholders = batch.map(() => '?').join(',');
    await client.execute(
      `UPDATE arsip SET deleted_at = datetime('now') WHERE id IN (${placeholders})`,
      batch
    );
  }
  console.log(`Deleted ${toDelete.length} records`);
} else {
  console.log("No duplicates found");
}

process.exit(0);
