const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkSubjects() {
  try {
    const res = await pool.query("SELECT id, name FROM subjects WHERE course_id = 41 ORDER BY name ASC");
    console.log("Subjects for Course 41:");
    res.rows.forEach(r => console.log(`${r.id}: ${r.name}`));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

checkSubjects();
