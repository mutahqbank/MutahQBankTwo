const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:LGEAM1IusyySlm8PM_fIO5L@junction.proxy.rlwy.net:19777/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT s.id, s.subject, c.course, s.active, s.is_restricted 
      FROM subjects s 
      JOIN courses c ON s.course_id = c.id 
      WHERE c.course ILIKE '%Pediatric%' 
      AND (s.subject ILIKE '%UTI%' OR s.subject ILIKE '%Urinary%')
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    
    // Also check total count for Pediatric courses
    const res2 = await pool.query(`
      SELECT c.course, COUNT(*) as lecture_count
      FROM subjects s 
      JOIN courses c ON s.course_id = c.id 
      WHERE c.course ILIKE '%Pediatric%'
      GROUP BY c.course
    `);
    console.log("\nLecture Counts per Pediatric Course:");
    console.log(JSON.stringify(res2.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
