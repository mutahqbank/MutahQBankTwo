const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("--- USERS_ROLES ---");
    const roles = await pool.query("SELECT * FROM users_roles");
    console.table(roles.rows);

    console.log("\n--- DASHBOARD_USERS ---");
    const dashUsers = await pool.query("SELECT * FROM dashboard_users");
    console.table(dashUsers.rows);

    console.log("\n--- ACCOUNTS (Sample) ---");
    const accounts = await pool.query("SELECT username, role_id FROM accounts LIMIT 5");
    console.table(accounts.rows);

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
