const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT username, allowed_courses FROM dashboard_users WHERE username = 'j74'");
    if (res.rows.length > 0) {
      console.log("SUCCESS_INFO_START");
      console.log("USER:", res.rows[0].username);
      console.log("COURSES:", JSON.stringify(res.rows[0].allowed_courses));
      console.log("SUCCESS_INFO_END");
    } else {
      console.log("NOT_FOUND");
    }

    const courses = await pool.query("SELECT name, slug FROM courses");
    console.log("ALL_COURSES_START");
    console.log(JSON.stringify(courses.rows));
    console.log("ALL_COURSES_END");

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
