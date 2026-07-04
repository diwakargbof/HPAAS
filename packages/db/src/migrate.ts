import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { sslConfig } from "./client.js";

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations"
);

/**
 * Migrations run DDL, which doesn't always play well with a transaction-mode
 * pgbouncer connection (Supabase's pooled DATABASE_URL). Prefer
 * DIRECT_DATABASE_URL — Supabase's direct, non-pooled connection string —
 * when set; falls back to DATABASE_URL for local/direct Postgres.
 */
export async function migrate(): Promise<void> {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL (or DIRECT_DATABASE_URL) is not set");

  const pool = new pg.Pool({ connectionString: url, ssl: sslConfig(url), max: 1 });
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS _migrations (
         name TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );
    const applied = new Set(
      (await pool.query<{ name: string }>("SELECT name FROM _migrations")).rows.map((r) => r.name)
    );
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].includes("migrate")) {
  migrate()
    .then(() => console.log("migrations up to date"))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
