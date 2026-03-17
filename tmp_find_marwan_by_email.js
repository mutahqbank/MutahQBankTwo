const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const email = 'herzallah919@gmail.com';
    
    console.log(`Searching for email '${email}' in dashboard_users...`);
    const res1 = await pool.query("SELECT * FROM dashboard_users WHERE email = $1", [email]);
    console.log("dashboard_users:", JSON.stringify(res1.rows, null, 2));

    console.log("\nChecking all tables again to be absolutely sure...");
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log("Tables:", tables.join(', '));

    for (const table of ['accounts', 'users', 'dashboard_users', 'users_roles', 'roles']) {
        if (tables.includes(table)) {
            console.log(`\nChecking columns for ${table}...`);
            const colRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(`${table} columns:`, colRes.rows.map(r => r.column_name).join(', '));
            
            console.log(`Searching for email in ${table}...`);
            try {
                const searchRes = await pool.query(`SELECT * FROM ${table} WHERE email = $1 OR username = $1`, [email]);
                console.log(`${table} search result:`, JSON.stringify(searchRes.rows, null, 2));
            } catch (e) {
                console.log(`Email/Username search failed in ${table} (maybe column missing?)`);
            }
        }
    }

  } catch (e) {
    console.error("Main error:", e);
  } finally {
    pool.end();
  }
}

main();
