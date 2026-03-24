const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkFeatured() {
    try {
        const res = await pool.query(`
            SELECT p.id, p.custom_name, p.price, fp.display_order
            FROM packages p
            JOIN homepage_featured_packages fp ON p.id = fp.package_id
            ORDER BY fp.display_order ASC
        `);
        res.rows.forEach(row => {
            console.log(`${row.id} | ${row.custom_name} | ${row.price} | ${row.display_order}`);
        });
        await pool.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkFeatured();
