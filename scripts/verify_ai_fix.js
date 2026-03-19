const { suggestCategoryAction } = require('../app/actions/ai-actions');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Mock the dependencies if needed, but here we can try to run it directly if environment is set up.
// Since suggestCategoryAction is a Server Action, it might need 'use server' environment.
// For verification, I'll write a script that mimics the logic or calls the exported function if possible.

// Actually, I'll just check if the code compiles and the logic looks sound.
// I'll create a script that checks the subjects for a given course.

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function verify() {
    try {
        const courseId = 43; // OBS and GYN
        const res = await pool.query(`
            SELECT id, subject as name, description 
            FROM subjects 
            WHERE course_id = $1 AND active = true
        `, [courseId]);
        
        console.log(`Found ${res.rows.length} subjects for course ${courseId}`);
        if (res.rows.length > 0) {
            console.log("First subject:", res.rows[0]);
            console.log("SUCCESS: Subjects can be fetched on the server.");
        } else {
            console.log("WARNING: No subjects found for course 43.");
        }
    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await pool.end();
    }
}

verify();
