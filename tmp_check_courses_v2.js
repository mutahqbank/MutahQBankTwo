const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT course, slug FROM courses");
    console.log("ALL_COURSES_DEBUG");
    res.rows.forEach(r => {
      console.log(`COURSE: |${r.course}| SLUG: |${r.slug}|`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
