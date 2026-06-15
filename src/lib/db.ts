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
