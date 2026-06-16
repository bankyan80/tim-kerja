import { createClient, InValue } from "@libsql/client";

export function getClient() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;
  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

const client = getClient();
export default client;

type QueryArgs = InValue[] | Record<string, InValue>;

export const ORDER_SEKOLAH = `ORDER BY
  CASE
    WHEN nama LIKE 'SD%' THEN 1
    WHEN nama LIKE 'TK%' THEN 2
    WHEN nama LIKE 'KB%' THEN 3
    WHEN nama LIKE 'PAUD%' THEN 4
    ELSE 5
  END, nama`;

export const ORDER_SEKOLAH_S = `ORDER BY
  CASE
    WHEN s.nama LIKE 'SD%' THEN 1
    WHEN s.nama LIKE 'TK%' THEN 2
    WHEN s.nama LIKE 'KB%' THEN 3
    WHEN s.nama LIKE 'PAUD%' THEN 4
    ELSE 5
  END, s.nama`;

export async function query(sql: string, args?: QueryArgs) {
  if (!client) {
    console.warn("Database not configured. Set TURSO_DATABASE_URL env var.");
    return { rows: [], columns: [], rowsAffected: 0 };
  }
  try {
    const opts = args ? { sql, args } : { sql };
    const result = await client.execute(opts);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function queryAll(sql: string, args?: QueryArgs) {
  const result = await query(sql, args);
  return result.rows;
}

export async function queryOne(sql: string, args?: QueryArgs) {
  const result = await query(sql, args);
  return result.rows[0] || null;
}

export async function execute(sql: string, args?: QueryArgs) {
  if (!client) return { rows: [], columns: [], rowsAffected: 0 };
  return await client.execute(args ? { sql, args } : { sql });
}
