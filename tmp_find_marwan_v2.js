const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Searching for 'marwan' in dashboard_users...");
    const res1 = await pool.query("SELECT * FROM dashboard_users WHERE username ILIKE '%marwan%' OR email ILIKE '%marwan%' OR full_name ILIKE '%marwan%'");
    console.log("dashboard_users result:", JSON.stringify(res1.rows, null, 2));

    console.log("\nChecking users_roles schema...");
    const res2 = await pool.query("SELECT * FROM users_roles LIMIT 5");
    console.log("users_roles sample:", JSON.stringify(res2.rows, null, 2));

    console.log("\nChecking roles...");
    const res3 = await pool.query("SELECT * FROM roles");
    console.log("roles table:", JSON.stringify(res3.rows, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
