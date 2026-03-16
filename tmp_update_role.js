const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("UPDATE accounts SET role_id = 5 WHERE username IN ('bahaa_jafer33', 'j74')");
    console.log("Updated rows:", res.rowCount);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
