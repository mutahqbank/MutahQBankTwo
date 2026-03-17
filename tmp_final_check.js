const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("START_QUERY_EXECUTION");
    
    // Check dashboard_users for ID 500
    const userRes = await pool.query("SELECT id, username, email, full_name, role_id FROM dashboard_users WHERE id = 500");
    console.log("USER_DATA_START");
    console.log(JSON.stringify(userRes.rows, null, 2));
    console.log("USER_DATA_END");

    // Check roles
    const rolesRes = await pool.query("SELECT id, role FROM roles");
    console.log("ROLES_DATA_START");
    console.log(JSON.stringify(rolesRes.rows, null, 2));
    console.log("ROLES_DATA_END");

    console.log("END_QUERY_EXECUTION");
  } catch (e) {
    console.error("QUERY_ERROR:", e.message);
  } finally {
    await pool.end();
  }
}

main();
