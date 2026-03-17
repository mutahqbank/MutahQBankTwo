const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Fetching user 500 details...");
    const userRes = await pool.query("SELECT * FROM dashboard_users WHERE id = 500");
    console.log("User 500:", JSON.stringify(userRes.rows, null, 2));

    console.log("\nFetching all roles...");
    const rolesRes = await pool.query("SELECT * FROM roles");
    console.log("Roles:", JSON.stringify(rolesRes.rows, null, 2));

    if (userRes.rows.length > 0) {
        const username = userRes.rows[0].username;
        console.log(`\nChecking users_roles for username '${username}'...`);
        const userRolesRes = await pool.query("SELECT * FROM users_roles WHERE username = $1", [username]);
        console.log("User Roles mapping:", JSON.stringify(userRolesRes.rows, null, 2));
    }

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
