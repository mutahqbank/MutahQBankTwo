const { Pool } = require("pg")
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function listTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log("Tables:", res.rows.map(r => r.table_name).join(", "))
    
    for (const table of res.rows.map(r => r.table_name)) {
      const cols = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table])
      console.log(`Table ${table} columns:`, cols.rows.map(c => c.column_name).join(", "))
    }
  } catch (err) {
    console.error(err)
  } finally {
    await pool.end()
  }
}

listTables()
