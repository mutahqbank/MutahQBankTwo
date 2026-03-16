const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT allowed_courses FROM dashboard_users WHERE username = 'j74'");
    if (res.rows.length > 0) {
      console.log("J74_COURSES_RAW:", res.rows[0].allowed_courses);
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
