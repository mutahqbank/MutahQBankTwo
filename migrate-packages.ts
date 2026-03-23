import { query } from "./lib/database";

async function run() {
  try {
    await query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS custom_name VARCHAR(255)`);
    console.log("Added custom_name");
  } catch (e) {
    console.error("custom_name error", e);
  }
  try {
    await query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS design_level VARCHAR(50) DEFAULT 'normal'`);
    console.log("Added design_level");
  } catch (e) {
    console.error("design_level error", e);
  }
  process.exit(0);
}
run();
