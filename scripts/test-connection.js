import 'dotenv/config';
import pkg from "pg"

const { Pool } = pkg
const connectionString = process.env.DATABASE_URL
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
})

try {
  const client = await pool.connect()
  console.log("Connected successfully!")

  // List all tables
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `)
  console.log("\nTables found:", tables.rows.length)
  tables.rows.forEach(r => console.log("  -", r.table_name))

  // Sample row counts
  for (const row of tables.rows) {
    const count = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`)
    console.log(`  ${row.table_name}: ${count.rows[0].count} rows`)
  }

  client.release()
} catch (err) {
  console.error("Connection failed:", err.message)
} finally {
  await pool.end()
}
