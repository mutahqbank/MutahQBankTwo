const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT username, allowed_courses 
      FROM dashboard_users 
      WHERE username IN ('j74', 'bahaa_jafer33')
    `);
    console.log("Results:", JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
