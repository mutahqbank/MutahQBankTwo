import { query } from "./lib/database";

async function inspect() {
  try {
    const res = await query(`
      SELECT 
        c.id, 
        c.course AS name, 
        LOWER(REPLACE(c.course, ' ', '-')) as slug,
        (SELECT count(*) FROM subjects s WHERE s.course_id = c.id AND s.active = true) as subjects_count,
        (SELECT count(*) FROM questions q JOIN subjects s ON q.subject_id = s.id WHERE s.course_id = c.id AND s.active = true AND q.active = true) as questions_count
      FROM courses c
      ORDER BY c.id ASC
    `);
    
    console.log("ID | Name | Slug | Subjects | Questions");
    console.log("---|---|---|---|---");
    res.rows.forEach((r: any) => {
      console.log(`${r.id} | ${r.name} | ${r.slug} | ${r.subjects_count} | ${r.questions_count}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

inspect();
