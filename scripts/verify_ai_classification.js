const { suggestCategoryWithOpenAI } = require('../lib/openai');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    try {
        // 1. Fetch relevant subjects for OBS course 43
        const subRes = await pool.query(
            "SELECT id, subject as name, description FROM subjects WHERE course_id = 43"
        );
        const lectures = subRes.rows;

        // 2. Test Case: A question about HELLP syndrome
        const question = "A 32-year-old pregnant woman presents with epigastric pain, elevated liver enzymes, and low platelets at 34 weeks gestation. What is the most likely diagnosis?";
        const explanation = "The clinical presentation of epigastric pain, hemolysis, elevated liver enzymes, and low platelets in pregnancy is highly suggestive of HELLP syndrome, a severe complication of preeclampsia.";
        const options = ["Placental abruption", "HELLP syndrome", "Acute fatty liver of pregnancy", "Cholecystitis"];

        console.log("--- RUNNING AI CLASSIFICATION TEST ---");
        const result = await suggestCategoryWithOpenAI(
            question,
            explanation,
            options,
            lectures,
            "OBS and GYN"
        );

        console.log("\n--- TEST RESULT ---");
        console.log(JSON.stringify(result, null, 2));

        if (result && result.lectureId) {
            const matched = lectures.find(l => l.id === result.lectureId);
            console.log(`Matched Subject: ${matched ? matched.name : 'Unknown'}`);
            if (matched && matched.name === "Hypertensive disorders in pregnancy") {
                console.log("SUCCESS: Correctly matched to Hypertensive disorders!");
            } else {
                console.log("Mismatched or unexpected result.");
            }
        }

        process.exit(0);
    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
}
run();
