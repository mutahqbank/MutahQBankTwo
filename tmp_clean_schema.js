const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log("ALL_TABLES_JSON:" + JSON.stringify(tables));

    for (const table of tables) {
        const colRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`);
        console.log(`COLUMNS_${table}_JSON:` + JSON.stringify(colRes.rows.map(r => r.column_name)));
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
