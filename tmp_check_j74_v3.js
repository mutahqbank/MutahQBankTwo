const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT * FROM dashboard_users WHERE username = 'j74'");
    if (res.rows.length > 0) {
      const user = res.rows[0];
      console.log("FOUND_J74");
      console.log("Username:", user.username);
      console.log("Allowed Courses:", user.allowed_courses);
    } else {
      console.log("NOT_FOUND_IN_DASHBOARD_USERS");
    }

    const acc = await pool.query(`
      SELECT a.username, r.role 
      FROM accounts a 
      JOIN users_roles r ON a.role_id = r.id 
      WHERE a.username = 'j74'
    `);
    console.log("Account Info:", JSON.stringify(acc.rows));

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
