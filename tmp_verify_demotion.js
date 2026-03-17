const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Verifying demotion for user ID 500...");

    // 1. Check accounts + users_roles
    const accountRes = await pool.query(`
      SELECT a.username, a.role_id, r.role
      FROM accounts a
      JOIN users_roles r ON a.role_id = r.id
      WHERE a.user_id = 500
    `);
    
    console.log("--- ACCOUNTS / ROLES CHECK ---");
    if (accountRes.rows.length === 0) {
      console.log("NO_ACCOUNT_FOUND");
    } else {
      const a = accountRes.rows[0];
      console.log(`Username: ${a.username}`);
      console.log(`Role ID: ${a.role_id}`);
      console.log(`Role Name: ${a.role}`);
    }

    // 2. Check dashboard_users
    const dashRes = await pool.query(`
      SELECT username, role, active
      FROM dashboard_users
      WHERE username = (SELECT username FROM accounts WHERE user_id = 500)
    `);

    console.log("\n--- DASHBOARD_USERS CHECK ---");
    if (dashRes.rows.length === 0) {
      console.log("NO_DASHBOARD_USER_FOUND");
    } else {
      const d = dashRes.rows[0];
      console.log(`Username: ${d.username}`);
      console.log(`Role: ${d.role}`);
      console.log(`Active: ${d.active}`);
    }

  } catch (e) {
    console.error("Verification error: " + e.message);
  } finally {
    pool.end();
  }
}

main();
