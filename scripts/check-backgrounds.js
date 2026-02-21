import pg from "pg"
const { Pool } = pg

const pool = new Pool({
  connectionString: "postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway"
})

const { rows } = await pool.query("SELECT id, course, background FROM courses WHERE active = true ORDER BY id")
for (const r of rows) {
  console.log(`id=${r.id}, name="${r.course}", background="${r.background || 'NULL'}"`)
}
await pool.end()
