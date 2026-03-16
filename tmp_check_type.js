const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dashboard_users' AND column_name = 'allowed_courses'
    `);
    console.log("Column Info:", JSON.stringify(res.rows[0], null, 2));

    const sample = await pool.query("SELECT allowed_courses FROM dashboard_users WHERE username = 'j74'");
    if (sample.rows.length > 0) {
      console.log("Type of allowed_courses:", typeof sample.rows[0].allowed_courses);
      console.log("Is array:", Array.isArray(sample.rows[0].allowed_courses));
      console.log("Value:", sample.rows[0].allowed_courses);
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
