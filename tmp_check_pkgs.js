const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkPackages() {
    try {
        const res = await pool.query('SELECT id, custom_name, price, active FROM packages ORDER BY id ASC');
        res.rows.forEach(row => {
            console.log(`${row.id} | ${row.custom_name} | ${row.price}`);
        });
        await pool.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPackages();
