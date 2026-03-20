import { query } from "./lib/database";

async function listCourses() {
  try {
    const res = await query("SELECT id, course, active FROM courses");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

listCourses();
