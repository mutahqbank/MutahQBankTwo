const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkImages() {
  try {
    const res = await pool.query("SELECT id, course, background FROM courses WHERE id = 20");
    const row = res.rows[0];
    if (row) {
      console.log(`ID: ${row.id}`);
      console.log(`Course: ${row.course}`);
      console.log(`Background Raw: ${Buffer.from(row.background || '').toString('hex')}`);
      console.log(`Background Length: ${row.background ? row.background.length : 0}`);
      console.log(`Background Stringified: ${JSON.stringify(row.background)}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkImages();
