import pg from "pg";
const { Pool } = pg;

import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    // Check accounts table structure and sample data
    const accounts = await client.query(`
      SELECT a.username, a.password_hash, a.role_id, a.active, a.user_id,
             u.first_name, u.last_name, u.email, u.phone,
             r.role
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      WHERE a.username IN ('ibrahim', 'zhraa', 'mkbnat')
      LIMIT 5
    `);
    console.log("Sample accounts:");
    for (const row of accounts.rows) {
      console.log(`  username=${row.username}, role=${row.role}, active=${row.active}, password_hash_length=${row.password_hash?.length}, password_hash_start=${row.password_hash?.substring(0, 20)}`);
    }

    // Check users table structure
    const userCols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'users' ORDER BY ordinal_position
    `);
    console.log("\nUsers table columns:", userCols.rows.map(r => r.column_name).join(", "));

    // Check accounts table structure
    const accCols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'accounts' ORDER BY ordinal_position
    `);
    console.log("Accounts table columns:", accCols.rows.map(r => r.column_name).join(", "));

    // Check users_roles
    const roles = await client.query(`SELECT * FROM users_roles`);
    console.log("\nRoles:", JSON.stringify(roles.rows));

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
