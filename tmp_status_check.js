const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("--- FINAL STATUS CHECK FOR MARWAN (ID 500) ---");
    
    const accountRes = await pool.query(`
      SELECT a.username, a.role_id, r.role
      FROM accounts a
      JOIN users_roles r ON a.role_id = r.id
      WHERE a.user_id = 500
    `);
    console.log("Accounts Role:", JSON.stringify(accountRes.rows));

    const dashRes = await pool.query(`
      SELECT username, role
      FROM dashboard_users
      WHERE username = 'Marwan'
    `);
    console.log("Dashboard Role:", JSON.stringify(dashRes.rows));

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
