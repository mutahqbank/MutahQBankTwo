const OpenAI = require('openai');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function suggestCategoryWithOpenAI(question, explanation, options, lectures, courseName) {
  const formattedOptions = options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(", ");
  const structuredLectures = lectures.map(l => 
    `ID: ${l.id} | Topic: ${l.name} ${l.description ? `(Clinical Context: ${l.description})` : ""}`
  ).join("\n");

  const systemInstruction = `
    You are a Senior Medical Classifier. Map the MCQ to the SINGLE most relevant Topic ID.
    Return ONLY a JSON object: { "reasoning": "...", "lectureId": [ID number] }
  `;

  const userPrompt = `
    Available Lectures:
    ${structuredLectures}
    
    MCQ:
    - Question: "${question}"
    - Options: ${formattedOptions}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result;
}

async function debug() {
  const question = "Which of the following statements regarding Group A Streptococcal (GAS) pharyngitis is INCORRECT?";
  const options = ["It is frequently associated with high-grade fever and sudden onset of sore throat.", "Palatal petechiae and a 'strawberry tongue' may be seen on physical examination.", "It is the most common cause of pharyngitis in children under 3 years of age.", "Tender anterior cervical lymphadenopathy is a classic clinical finding.", "Antibiotic treatment is primarily aimed at preventing acute rheumatic fever."];
  const courseId = 44; 

  console.log("Fetching subjects for course 44...");
  const subRes = await pool.query("SELECT id, subject as name, description FROM subjects WHERE course_id = $1 AND active = true", [courseId]);
  const subjects = subRes.rows;
  
  const filteredSubjects = (subjects || [])
    .filter(s => {
      const name = (s.name || "").toLowerCase();
      if (!name) return false;
      return !name.includes("unclassified pool") && !name.includes("---");
    })
    .map(s => ({
      id: s.id,
      name: s.name || "Unknown",
      description: s.description
    }));

  console.log("Filtered Subjects (IDs only):", filteredSubjects.map(s => `${s.id}: ${s.name}`).join(", "));

  const aiResult = await suggestCategoryWithOpenAI(
    question,
    "", // explanation
    options,
    filteredSubjects,
    "Pediatric(Final)"
  );

  console.log("--- DEBUG RESULT ---");
  console.log(JSON.stringify(aiResult, null, 2));

  await pool.end();
}

debug();
