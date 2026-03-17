const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDetails() {
  try {
    console.log("Checking first few courses...");
    const courses = await pool.query(`SELECT * FROM courses LIMIT 5`);
    console.table(courses.rows);

    console.log("\nChecking if there's a periods table...");
    const periods = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'periods'
    `);
    if (periods.rows.length > 0) {
      const periodsContent = await pool.query(`SELECT * FROM periods`);
      console.table(periodsContent.rows);
    } else {
      console.log("No periods table found.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkDetails();
