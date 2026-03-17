const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const roles = await pool.query("SELECT id, role FROM users_roles ORDER BY id");
    console.log("--- ROLES ---");
    roles.rows.forEach(r => console.log(`ID: ${r.id}, Role: ${r.role}`));

    const account = await pool.query("SELECT role_id FROM accounts WHERE user_id = 500");
    console.log("Marwan Current Role ID: " + account.rows[0].role_id);

  } catch (e) {
    console.error("ERROR: " + e.message);
  } finally {
    pool.end();
  }
}

main();
