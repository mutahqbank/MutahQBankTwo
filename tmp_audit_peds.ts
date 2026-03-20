import { query } from "./lib/database";

async function audit() {
  try {
    const res = await query(`
      SELECT 
        c.id, 
        c.course AS name, 
        c.active,
        LOWER(REPLACE(c.course, ' ', '-')) as slug,
        (SELECT count(*) FROM subjects s WHERE s.course_id = c.id AND s.active = true) as subjs,
        (SELECT count(*) FROM questions q JOIN subjects s ON q.subject_id = s.id WHERE s.course_id = c.id AND s.active = true AND q.active = true) as qns
      FROM courses c
      WHERE c.course ILIKE '%Pediatric%'
      ORDER BY c.id ASC
    `);
    
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

audit();
