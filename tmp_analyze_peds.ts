import { query } from "./lib/database";

async function analyze() {
  try {
    const courseId = 44; // Pediatric(Final)
    const res = await query(`
      SELECT 
        q.active as q_active,
        s.active as s_active,
        count(*) as count
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      WHERE s.course_id = $1
      GROUP BY q.active, s.active
    `, [courseId]);
    
    console.log(`Analysis for Course ID ${courseId}:`);
    console.table(res.rows);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

analyze();
