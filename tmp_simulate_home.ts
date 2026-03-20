import { query } from "./lib/database";

const MAJOR_SLUGS = [
  "surgery(miniosce)",
  "pediatric(miniosce)",
  "obs-and-gyn-(miniosce)",
  "internal-medicine(miniosce)",
  "surgery(final)",
  "obs-and-gyn-(final)",
  "internal-medicine(final)",
  "pediatric(final)"
];

async function simulate() {
  try {
    const res = await query(`
      SELECT 
        c.id, 
        c.course as name, 
        c.active as is_active, 
        LOWER(REPLACE(c.course, ' ', '-')) as slug,
        (SELECT count(*) FROM subjects s WHERE s.course_id = c.id AND s.active = true) as total_subjects,
        (SELECT count(*) FROM questions q JOIN subjects s ON q.subject_id = s.id WHERE s.course_id = c.id AND s.active = true AND q.active = true) as total_questions
      FROM courses c
      ORDER BY c.id ASC
    `);
    
    const allCourses = res.rows;
    const courses = allCourses.filter((c: any) => c.slug !== 'test');
    const majors = courses.filter((c: any) => MAJOR_SLUGS.includes(c.slug));
    
    console.log("Majors Data:");
    console.table(majors.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      subjs: c.total_subjects,
      qns: c.total_questions,
      active: c.is_active
    })));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

simulate();
