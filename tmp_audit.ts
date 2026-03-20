import { query } from "./lib/database";

async function audit() {
  try {
    const res = await query(`
      SELECT 
        c.id, 
        c.course AS name, 
        c.active,
        LOWER(REPLACE(c.course, ' ', '-')) as slug,
        (SELECT count(*) FROM subjects s WHERE s.course_id = c.id AND s.active = true) as total_subjects,
        (SELECT count(*) FROM questions q JOIN subjects s ON q.subject_id = s.id WHERE s.course_id = c.id AND s.active = true AND q.active = true) as total_questions
      FROM courses c
      ORDER BY c.id ASC
    `);
    
    console.table(res.rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      active: r.active,
      subjects: r.total_subjects,
      questions: r.total_questions
    })));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

audit();
