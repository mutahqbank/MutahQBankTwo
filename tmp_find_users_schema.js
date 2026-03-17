const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("SEARCHING_ALL_SCHEMAS");
    const res = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name IN ('users', 'accounts')");
    console.log("FOUND_TABLES:", JSON.stringify(res.rows, null, 2));

    for (const row of res.rows) {
        console.log(`\nColumns for ${row.table_schema}.${row.table_name}:`);
        const colRes = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '${row.table_schema}' AND table_name = '${row.table_name}' ORDER BY ordinal_position`);
        console.log(JSON.stringify(colRes.rows, null, 2));
    }

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
