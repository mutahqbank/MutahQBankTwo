import pg from "pg"

import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const { rows } = await pool.query("SELECT id, course, background FROM courses WHERE active = true ORDER BY id")
for (const r of rows) {
  console.log(`id=${r.id}, name="${r.course}", background="${r.background || 'NULL'}"`)
}
await pool.end()
