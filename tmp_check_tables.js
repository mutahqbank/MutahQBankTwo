const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log("Tables:", res.rows.map(r => r.table_name));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
