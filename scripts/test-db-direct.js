const { Pool } = require("pg");

const pool = new Pool({
  host: "interchange.proxy.rlwy.net",
  port: 47823,
  database: "railway",
  user: "postgres",
  password: "sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    const res = await pool.query("SELECT NOW() as now");
    console.log("Connected successfully! Server time:", res.rows[0].now);
    
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log("Existing tables:", tables.rows.map(r => r.table_name));
  } catch (err) {
    console.log("Connection failed:", err.message);
  } finally {
    await pool.end();
  }
}

main();
