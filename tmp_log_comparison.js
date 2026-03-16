const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const courseRes = await pool.query("SELECT id, course FROM courses");
    const userRes = await pool.query("SELECT allowed_courses FROM dashboard_users WHERE username = 'j74'");
    
    let output = "=== DATABASE COURSES ===\n";
    courseRes.rows.forEach(r => {
      output += `ID: ${r.id} | NAME: "${r.course}"\n`;
    });
    
    output += "\n=== J74 ALLOWED COURSES ===\n";
    if (userRes.rows.length > 0) {
      userRes.rows[0].allowed_courses.forEach(c => {
        output += `- "${c}"\n`;
      });
    } else {
      output += "User j74 not found in dashboard_users\n";
    }

    fs.writeFileSync('comparison_log.txt', output);
    console.log("Logged to comparison_log.txt");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
