const { query } = require('./lib/database');
async function run() {
  const r = await query('SELECT id, subject FROM subjects WHERE course_id = 1');
  console.log(JSON.stringify(r.rows));
}
run();
