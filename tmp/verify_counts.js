const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("SELECT id, course FROM courses WHERE course ILIKE '%Pediatric%'");
    for (const row of res.rows) {
      const subjects = await pool.query("SELECT count(*) as total, count(*) FILTER (WHERE active = true) as active FROM subjects WHERE course_id = $1", [row.id]);
      console.log(`Course ${row.id} (${row.course}): Total Subjects = ${subjects.rows[0].total}, Active = ${subjects.rows[0].active}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
