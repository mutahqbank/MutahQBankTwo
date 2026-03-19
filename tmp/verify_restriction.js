const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // 1. Check current state of a subject
    const getRes = await pool.query("SELECT id, subject, is_restricted FROM subjects LIMIT 1");
    const sub = getRes.rows[0];
    console.log('Original state:', sub);

    // 2. Toggle state
    const newState = !sub.is_restricted;
    await pool.query("UPDATE subjects SET is_restricted = $1 WHERE id = $2", [newState, sub.id]);
    
    // 3. Verify
    const verifyRes = await pool.query("SELECT is_restricted FROM subjects WHERE id = $1", [sub.id]);
    console.log('New state:', verifyRes.rows[0]);

    // 4. Reset
    await pool.query("UPDATE subjects SET is_restricted = $1 WHERE id = $2", [sub.is_restricted, sub.id]);
    console.log('State reset to original.');

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
