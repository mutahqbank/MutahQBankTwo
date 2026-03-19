const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

async function testReasoning() {
    console.log("Testing o3-mini classification...");
    
    const question = "A 3-year-old child presents with high fever, neck stiffness, and a positive Brudzinski sign. Lumbar puncture shows cloudy fluid with 1000 cells/mm3 (90% neutrophils), low glucose, and high protein.";
    const options = ["A) Epilepsy", "B) Meningitis", "C) Cerebral Palsy", "D) Simple Febrile Seizure"];
    const subjects = [
        { id: 101, name: "Pediatric Neurology", description: "Brain, spinal cord, and meningeal infections." },
        { id: 102, name: "Respiratory Medicine", description: "Pneumonia and asthma." },
        { id: 103, name: "Neonatology", description: "Newborn care." }
    ];

    const systemInstruction = `
    You are a Senior Medical Classifier. Map to the most relevant Topic ID.
    OUTPUT FORMAT: Return ONLY JSON { "reasoning": "...", "lectureId": ID }
    `;

    const userPrompt = `
    Available Lectures:
    ${subjects.map(s => `ID: ${s.id} | Topic: ${s.name} (${s.description})`).join("\n")}
    
    MCQ:
    - Question: "${question}"
    - Options: ${options.join(", ")}
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "o3-mini",
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
        });

        console.log("Response:", response.choices[0].message.content);
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testReasoning();
