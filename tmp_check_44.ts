import { query } from "./lib/database";

async function audit() {
  try {
    const courseId = 44; // Pediatric(Final)
    const res = await query(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE active = true) as active
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      WHERE s.course_id = $1
    `, [courseId]);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

audit();
