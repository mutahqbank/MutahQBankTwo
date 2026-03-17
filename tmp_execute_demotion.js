const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Starting demotion for Marwan Ahmad (ID 500)...");

    // 1. Update accounts table
    console.log("Updating 'accounts' table...");
    const accountUpdate = await pool.query(
      "UPDATE accounts SET role_id = 2 WHERE user_id = 500 RETURNING username"
    );
    
    if (accountUpdate.rows.length === 0) {
      console.log("Error: User account with ID 500 not found in 'accounts' table.");
      return;
    }
    
    const username = accountUpdate.rows[0].username;
    console.log(`Updated 'accounts' for username: ${username}`);

    // 2. Update dashboard_users table
    console.log("Updating 'dashboard_users' table...");
    const dashUpdate = await pool.query(
      "UPDATE dashboard_users SET role = 'user' WHERE username = $1",
      [username]
    );
    console.log(`Updated 'dashboard_users' for username: ${username}. Rows affected: ${dashUpdate.rowCount}`);

    console.log("Demotion completed successfully.");

  } catch (e) {
    console.error("CRITICAL ERROR during demotion: " + e.message);
  } finally {
    pool.end();
  }
}

main();
