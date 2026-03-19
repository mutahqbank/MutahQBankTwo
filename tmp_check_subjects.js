const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkSubjects() {
  try {
    const courseRes = await pool.query("SELECT id, course FROM courses WHERE course ILIKE '%Pediatric%'");
    const courses = courseRes.rows;
    console.log("Courses found:", courses);

    const courseId = 44; // Pediatric(Final)
    const subRes = await pool.query("SELECT id, subject, active FROM subjects WHERE course_id = $1", [courseId]);
    console.log(`Subjects for course ${courseId}:`);
    const subjects = subRes.rows;
    subjects.forEach(r => {
        if (r.subject.toLowerCase().includes("urti") || r.subject.toLowerCase().includes("respiratory") || r.subject.toLowerCase().includes("pulmonology")) {
            console.log(`MATCH FOUND: ${r.id}: ${r.subject} (Active: ${r.active})`);
        }
    });
    console.log("Total subjects:", subjects.length);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkSubjects();
