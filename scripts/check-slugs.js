import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, course, public_id, active FROM courses WHERE active = true ORDER BY id LIMIT 10");
    console.log("Active courses (id, name, public_id/slug):");
    for (const row of res.rows) {
      console.log(`  id=${row.id}, name="${row.course}", slug="${row.public_id}"`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
