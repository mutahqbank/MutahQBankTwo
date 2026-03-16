const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dashboards'
    `);
    console.log("Dashboards Columns:", JSON.stringify(res.rows, null, 2));

    const sample = await pool.query("SELECT * FROM dashboards LIMIT 1");
    console.log("Sample Data:", JSON.stringify(sample.rows, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
