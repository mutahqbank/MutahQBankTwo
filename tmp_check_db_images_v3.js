const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkImages() {
  try {
    const res = await pool.query("SELECT id, course, background FROM courses WHERE active = true");
    res.rows.forEach(row => {
      const bg = row.background ? row.background.replace(/\n/g, '\\n').replace(/\r/g, '\\r') : 'NULL';
      console.log(`ID: ${row.id} | Course: ${row.course} | Background: "${bg}"`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkImages();
