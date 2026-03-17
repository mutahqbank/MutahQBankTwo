const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkCoursesSchema() {
  try {
    console.log("Checking schema for 'courses' table...");
    const coursesSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'courses'
    `);
    console.table(coursesSchema.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkCoursesSchema();
