import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

const { rows } = await c.execute(
  "SELECT nama, nip, nik FROM gtk WHERE deleted_at IS NULL ORDER BY nama"
);
for (const r of rows) {
  console.log(`${r.nama} | nip=${r.nip || "-"} | nik=${r.nik || "-"}`);
}
console.log("Total:", rows.length);
