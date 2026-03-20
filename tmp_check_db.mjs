import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function check() {
  const res = await pool.query(`
    SELECT 
      c.id, 
      c.course, 
      c.public_id,
      LOWER(REPLACE(c.course, ' ', '-')) as slug,
      (SELECT count(*) FROM subjects s WHERE s.course_id = c.id AND s.active = true) as total_subjects,
      (SELECT count(*) FROM questions q JOIN subjects s ON q.subject_id = s.id WHERE s.course_id = c.id AND s.active = true AND q.active = true) as total_questions
    FROM courses c
    ORDER BY c.id ASC
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

check().catch(console.error);
