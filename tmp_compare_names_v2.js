const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const courseRes = await pool.query("SELECT course FROM courses");
    const userRes = await pool.query("SELECT allowed_courses FROM dashboard_users WHERE username = 'j74'");
    
    console.log("FULL_DEBUG_DATA_START");
    console.log("DB_COURSES:", JSON.stringify(courseRes.rows.map(r => r.course)));
    if (userRes.rows.length > 0) {
      console.log("J74_ALLOWED:", JSON.stringify(userRes.rows[0].allowed_courses));
    }
    console.log("FULL_DEBUG_DATA_END");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
