const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT username, allowed_courses FROM dashboard_users WHERE username = 'j74'");
    console.log("User j74:", JSON.stringify(res.rows, null, 2));

    const allInstructors = await pool.query(`
      SELECT a.username, r.role, du.allowed_courses
      FROM accounts a
      JOIN users_roles r ON a.role_id = r.id
      LEFT JOIN dashboard_users du ON a.username = du.username
      WHERE r.role = 'instructor'
    `);
    console.log("All Instructors:", JSON.stringify(allInstructors.rows, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
