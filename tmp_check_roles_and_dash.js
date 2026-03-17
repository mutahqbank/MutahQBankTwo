const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    try {
        console.log("--- USERS_ROLES ---");
        const roles = await pool.query("SELECT * FROM users_roles");
        console.table(roles.rows);

        console.log("\n--- DASHBOARD_USERS ---");
        const dashUsers = await pool.query("SELECT * FROM dashboard_users");
        console.table(dashUsers.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
