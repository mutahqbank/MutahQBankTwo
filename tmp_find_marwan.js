const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Searching for 'marwan' in dashboard_users...");
    const res1 = await pool.query("SELECT * FROM dashboard_users WHERE username ILIKE '%marwan%'");
    console.log(JSON.stringify(res1.rows, null, 2));

    console.log("\nSearching for 'marwan' in accounts...");
    const res2 = await pool.query("SELECT * FROM accounts WHERE username ILIKE '%marwan%'");
    console.log(JSON.stringify(res2.rows, null, 2));
    
    console.log("\nChecking roles table to see what 'user' role_id is...");
    const res3 = await pool.query("SELECT * FROM roles");
    console.log(JSON.stringify(res3.rows, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
