const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const courseRes = await pool.query("SELECT course FROM courses");
    const userRes = await pool.query("SELECT allowed_courses FROM dashboard_users WHERE username = 'j74'");
    
    console.log("DATABASE_COURSES:");
    courseRes.rows.forEach(r => console.log(`- "${r.course}"`));
    
    if (userRes.rows.length > 0) {
      console.log("\nJ74_ALLOWED_COURSES:");
      userRes.rows[0].allowed_courses.forEach(c => console.log(`- "${c}"`));
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
