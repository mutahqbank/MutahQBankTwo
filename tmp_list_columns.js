const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const tables = ['dashboard_users', 'roles', 'users_roles'];
    for (const table of tables) {
      const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
      console.log(`Columns for ${table}:`);
      console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
