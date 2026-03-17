
import { query } from "./lib/database";

async function test() {
  try {
    // 1. Find an unclassified question
    const unclassified = await query("SELECT id, course_id, subject_id, status FROM questions WHERE status = 'unclassified' LIMIT 1");
    if (unclassified.rows.length === 0) {
      console.log("No unclassified questions found to test with.");
      return;
    }
    const q = unclassified.rows[0];
    console.log("Testing with question:", q);

    // 2. Find a valid subject for this course (other than the pool)
    const subject = await query("SELECT id, subject FROM subjects WHERE course_id = $1 AND subject != 'Unclassified Pool' LIMIT 1", [q.course_id]);
    if (subject.rows.length === 0) {
      console.log("No valid subjects found for this course to test move.");
      return;
    }
    const s = subject.rows[0];
    console.log("Moving to subject:", s);

    // 3. Perform manual update in DB (simulating PATCH)
    await query("UPDATE questions SET status = 'draft', subject_id = $1 WHERE id = $2", [s.id, q.id]);
    console.log("Update executed.");

    // 4. Verify
    const verified = await query("SELECT id, status, subject_id FROM questions WHERE id = $1", [q.id]);
    console.log("Verification result:", verified.rows[0]);

    // 5. Cleanup (move back)
    await query("UPDATE questions SET status = 'unclassified', subject_id = $1 WHERE id = $2", [q.subject_id, q.id]);
    console.log("Cleanup executed.");

  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
