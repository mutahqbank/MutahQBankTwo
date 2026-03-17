const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const roles = await pool.query("SELECT id, role FROM users_roles");
    console.log("--- ROLES ---");
    roles.rows.forEach(r => console.log(`ID: ${r.id}, Role: ${r.role}`));

    const account = await pool.query("SELECT * FROM accounts WHERE user_id = 500");
    console.log("--- ACCOUNT 500 ---");
    if (account.rows.length === 0) {
        console.log("No account found for user_id 500");
    } else {
        const a = account.rows[0];
        console.log(`Username: ${a.username}`);
        console.log(`User ID: ${a.user_id}`);
        console.log(`Role ID: ${a.role_id}`);
        console.log(`Active: ${a.active}`);
    }

    const user = await pool.query("SELECT * FROM users WHERE id = 500");
    console.log("--- USER 500 ---");
    if (user.rows.length === 0) {
        console.log("No user found with id 500");
    } else {
        const u = user.rows[0];
        console.log(`ID: ${u.id}`);
        console.log(`Email: ${u.email}`);
        console.log(`Name: ${u.first_name} ${u.last_name}`);
    }

  } catch (e) {
    console.error("ERROR: " + e.message);
  } finally {
    pool.end();
  }
}

main();
