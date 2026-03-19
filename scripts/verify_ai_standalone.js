const OpenAI = require('openai');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

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

        const courseName = "OBS and GYN";

        // Format options into a single string
        const formattedOptions = options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(", ");

        // Format lectures into lightweight structured list
        const structuredLectures = lectures.map(l => 
            `ID: ${l.id} | Topic: ${l.name} ${l.description ? `(Clinical Context: ${l.description.substring(0, 500)})` : ""}`
        ).join("\n");

        const systemInstruction = `
            You are a Senior Medical Consultant classifying MCQs for the ${courseName} course. 
            Your goal is to match the question to the SINGLE most relevant lecture from the provided list.

            ### DIFFERENTIAL CLASSIFICATION RULES:
            - **Hematology**: Distinguish between RBC issues (Anemia/Hemoglobinopathies) and Platelet/Clotting issues (Bleeding disorders). If a patient has petechiae/low platelets but normal Hb, it is NOT Anemia. Map petechiae/purpura/low platelets to "Bleeding disorders".
            - **Neurology**: Differentiate between the Brain (Encephalitis/Meningitis), Electrical issues (Epilepsy/Febrile Seizures), and Peripheral/Spinal issues (Acute Flaccid Paralysis/GBS/Myelitis). 
            - **Obstetrics**: Distinguish between normal Physiology and specific Pathologies (e.g., Hypertension vs. Renal Disorders).
            - **Neonatology**: Distinguish between Jaundice (Bilirubin), Respiratory issues (RDS), and Infections (Sepsis).

            ### OUTPUT INSTRUCTIONS:
            - Compare the MCQ's clinical presentation against the lecture names and descriptions.
            - THE DESCRIPTION FIELD CONTAINS CRITICAL CLINICAL KEYWORDS (ANCHORS). USE THEM TO RESOLVE AMBIGUITY.
            - If the MCQ is too general or doesn't fit any specific lecture, return "null".
            
            Return ONLY a JSON object:
            {
            "reasoning": "Short clinical justification (e.g. Low platelets and petechiae maps to Bleeding Disorders)",
            "lectureId": [ID number]
            }
        `;

        const userPrompt = `
            Available Lectures:
            ${structuredLectures}
            
            MCQ for Classification:
            - Question: "${question}"
            - Options: ${formattedOptions}
            - Explanation (Clinical Pearls): "${explanation}"
        `;

        console.log("--- RUNNING AI CLASSIFICATION TEST ---");
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const text = response.choices[0].message.content || "{}";
        const result = JSON.parse(text);

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
