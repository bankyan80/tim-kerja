import { createClient, InValue } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default client;

type QueryArgs = InValue[] | Record<string, InValue>;

export async function query(sql: string, args?: QueryArgs) {
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
  return await client.execute(args ? { sql, args } : { sql });
}
