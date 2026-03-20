import { query } from "./lib/database";

async function audit() {
  try {
    const res = await query(`
      SELECT 
        id, 
        course, 
        active,
        LOWER(REPLACE(course, ' ', '-')) as slug
      FROM courses 
      WHERE course ILIKE '%Pediatric%'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

audit();
