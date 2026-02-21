import pg from 'pg';

import 'dotenv/config';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    try {
        const res1 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assessments'");
        console.log("ASSESSMENTS:");
        console.table(res1.rows);

        const res2 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assessments_questions'");
        console.log("ASSESSMENTS_QUESTIONS:");
        console.table(res2.rows);

        const res3 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sessions'");
        console.log("SESSIONS:");
        console.table(res3.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
