import { query } from "./lib/database";

async function checkSubjects() {
  try {
    // Find Pediatric courses
    const coursesRes = await query("SELECT id, course FROM courses WHERE course ILIKE '%Pediatric%'", []);
    console.log("Found Pediatric Courses:", coursesRes.rows);

    for (const course of coursesRes.rows) {
      const subjectsRes = await query(
        "SELECT id, subject, active, is_restricted FROM subjects WHERE course_id = $1 ORDER BY subject ASC",
        [course.id]
      );
      console.log(`\nSubjects for ${course.course} (ID: ${course.id}): Count ${subjectsRes.rows.length}`);
      
      const utis = subjectsRes.rows.filter(s => s.subject.toLowerCase().includes('uti') || s.subject.toLowerCase().includes('urinary'));
      if (utis.length > 0) {
        console.log("UTI/Urinary Matches:", utis);
      } else {
        console.log("No UTI/Urinary matches found in this course.");
        // List first 5 to see naming style
        console.log("Sample subjects:", subjectsRes.rows.slice(0, 5));
      }
    }
  } catch (err) {
    console.error(err);
  }
}

checkSubjects();
