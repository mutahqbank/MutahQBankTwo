const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const tables = ['dashboard_users', 'users_roles', 'roles'];
    for (const table of tables) {
      console.log(`\n--- Schema for ${table} ---`);
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
        ORDER BY ordinal_position
      `);
      console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));
    }

    console.log("\nSearching for any user with ID 500 in dashboard_users (checking column names first)...");
    // Just dump 1 row to see the data
    const sample = await pool.query("SELECT * FROM dashboard_users LIMIT 1");
    console.log("Sample dashboard_user row keys:", Object.keys(sample.rows[0] || {}));

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
