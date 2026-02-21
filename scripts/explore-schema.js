import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    const tables = [
      "users", "users_roles", "courses", "subjects", "questions", "questions_types",
      "questions_periods", "options", "sub_questions", "packages", "plans",
      "subscriptions", "transactions", "sessions", "feeds", "feeds_types",
      "assessments", "assessments_questions", "assessments_subjects", "assessments_types",
      "figures", "figures_types", "exams", "accounts", "previews"
    ];

    for (const table of tables) {
      console.log(`\n=== ${table.toUpperCase()} ===`);
      const cols = await client.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [table]
      );
      cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'NOT NULL' : ''} ${r.column_default || ''}`));

      // Get row count
      const count = await client.query(`SELECT count(*) FROM "${table}"`);
      console.log(`  -> ${count.rows[0].count} rows`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => console.error(e));
