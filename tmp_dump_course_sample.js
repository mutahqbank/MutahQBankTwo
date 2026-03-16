const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT * FROM courses LIMIT 1");
    console.log("Course Sample:", JSON.stringify(res.rows[0], null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
