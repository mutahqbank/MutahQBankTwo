const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("SELECT id, subject FROM subjects WHERE course_id = 28");
    const withEmoji = res.rows.filter(r => /\p{Emoji}/u.test(r.subject) && !/^\d+$/.test(r.subject));
    console.log(`Course 28: Total=${res.rows.length}, WithEmoji=${withEmoji.length}`);
    if (withEmoji.length > 0) {
      console.log('Sample with emoji:', withEmoji[0].subject);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
