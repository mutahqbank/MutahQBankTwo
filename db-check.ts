import { query } from "./lib/database";

async function main() {
  const result = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assessments'");
  console.log(result.rows);
  process.exit(0);
}

main().catch(console.error);
