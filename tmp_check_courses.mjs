import { query } from "./lib/database.js";

async function checkCourses() {
  try {
    const res = await query("SELECT id, course, active FROM courses");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  }
}

checkCourses();
