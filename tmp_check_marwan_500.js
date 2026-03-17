const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Checking user 500 in dashboard_users...");
    const userRes = await pool.query("SELECT * FROM dashboard_users WHERE id = 500");
    console.log("User 500:", JSON.stringify(userRes.rows, null, 2));

    const username = userRes.rows[0]?.username;
    if (username) {
        console.log(`\nChecking roles for username '${username}' in users_roles...`);
        const userRolesRes = await pool.query("SELECT * FROM users_roles WHERE username = $1", [username]);
        console.log("User Roles:", JSON.stringify(userRolesRes.rows, null, 2));
    }

    console.log("\nChecking all roles in 'roles' table...");
    const rolesRes = await pool.query("SELECT * FROM roles");
    console.log("Available Roles:", JSON.stringify(rolesRes.rows, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
