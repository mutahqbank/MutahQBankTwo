const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT * FROM users_roles");
    console.log("ROLES_RESULT:" + JSON.stringify(res.rows));
    
    const userRes = await pool.query("SELECT * FROM users WHERE id = 500");
    console.log("USER_500_RESULT:" + JSON.stringify(userRes.rows));

    const accountRes = await pool.query("SELECT * FROM accounts WHERE user_id = 500");
    console.log("ACCOUNT_500_RESULT:" + JSON.stringify(accountRes.rows));

  } catch (e) {
    console.error("ERROR:" + e.message);
  } finally {
    pool.end();
  }
}

main();
