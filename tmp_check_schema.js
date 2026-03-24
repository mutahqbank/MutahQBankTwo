const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'packages'");
        res.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });
        await pool.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
