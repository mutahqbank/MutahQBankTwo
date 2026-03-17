const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
  try {
    console.log("Checking columns for 'questions' table...");
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'questions'
    `);
    console.table(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkColumns();
