const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("--- ROLE CONSISTENCY CHECK ---");
    
    const res = await pool.query(`
      SELECT 
        a.user_id, a.username, r.role as accounts_role, du.role as dash_role
      FROM accounts a
      JOIN users_roles r ON a.role_id = r.id
      LEFT JOIN dashboard_users du ON a.username = du.username
      WHERE r.role IN ('admin', 'instructor')
    `);

    res.rows.forEach(row => {
        console.log(`User: ${row.username} (ID: ${row.user_id}) | Accounts: ${row.accounts_role} | Dash: ${row.dash_role}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
