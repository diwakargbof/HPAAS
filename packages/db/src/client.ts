import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Load the repo-root .env regardless of which app imports us.
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env"),
});
dotenv.config();

// NUMERIC comes back as string by default; our amounts fit in doubles fine.
pg.types.setTypeParser(1700, (v) => parseFloat(v));

let pool: pg.Pool | null = null;

/**
 * Supabase (and most managed Postgres) requires TLS and doesn't issue a
 * certificate chain node's default trust store recognizes, so we relax
 * cert verification for those hosts specifically rather than globally.
 * Local dev (plain "localhost"/docker Postgres) needs no SSL at all.
 */
export function sslConfig(connectionString: string): pg.PoolConfig["ssl"] {
  if (process.env.PGSSLMODE === "disable") return undefined;
  const managedHost = /supabase\.(co|com)|render\.com|amazonaws\.com|neon\.tech/.test(
    connectionString
  );
  if (managedHost || process.env.PGSSLMODE === "require") {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

export function getPool(): pg.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set (copy .env.example to .env)");
    pool = new pg.Pool({
      connectionString: url,
      ssl: sslConfig(url),
      // Serverless functions (Vercel sets VERCEL=1) run many short-lived
      // instances concurrently — a small per-instance pool avoids
      // exhausting Supabase's pgbouncer connection slots. A persistent
      // process (local dev, a worker on Railway/Render/Fly) can hold a
      // normal-sized pool.
      max: process.env.VERCEL ? 1 : Number(process.env.PG_POOL_MAX ?? 10),
    });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
