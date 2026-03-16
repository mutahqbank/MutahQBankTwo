const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT * FROM courses");
    console.log("ALL_COURSES_DUMP");
    res.rows.forEach(r => {
      console.log(`ID: ${r.id} | COURSE: ${r.course} | SLUG: ${r.slug_name || r.slug || 'N/A'}`);
    });
    if (res.rows.length > 0) {
        console.log("COLUMNS:", Object.keys(res.rows[0]));
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
