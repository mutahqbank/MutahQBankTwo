import { query } from "./lib/database";

async function audit() {
  try {
    const res = await query(`
      SELECT 
        q.course_id as q_cid, 
        s.course_id as s_cid, 
        count(*) as count 
      FROM questions q 
      JOIN subjects s ON q.subject_id = s.id 
      WHERE s.course_id IN (28, 44) 
      GROUP BY q.course_id, s.course_id
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

audit();
