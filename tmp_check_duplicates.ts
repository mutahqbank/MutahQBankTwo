import { query } from "./lib/database";

async function checkDuplicates() {
  try {
    const courseRes = await query(`SELECT id, name FROM courses WHERE name ILIKE '%OBS and GYN (Final)%'`, []);
    if (courseRes.rows.length === 0) {
      console.log("Course not found");
      return;
    }
    const course = courseRes.rows[0];
    console.log(`Found Course: ${course.name} (ID: ${course.id})`);

    const subjectsRes = await query(`
      SELECT s.id, s.subject, s.description, 
             (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.id) as question_count
      FROM subjects s 
      WHERE s.course_id = $1
      ORDER BY s.subject
    `, [course.id]);

    console.log("\nSubjects in this course:");
    const counts: Record<string, number> = {};
    for (const s of subjectsRes.rows) {
      console.log(`- ID: ${s.id}, Name: ${s.subject}, Questions: ${s.question_count}`);
      counts[s.subject] = (counts[s.subject] || 0) + 1;
    }

    console.log("\nDuplicated subjects detected by name:");
    for (const [name, count] of Object.entries(counts)) {
      if (count > 1) {
        console.log(`- ${name} appears ${count} times`);
      }
    }

  } catch (error) {
    console.error("Error checking duplicates:", error);
  } finally {
    process.exit(0);
  }
}

checkDuplicates();
