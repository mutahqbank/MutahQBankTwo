const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/OPENAI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : "";

const openai = new OpenAI({
  apiKey: apiKey,
});

async function verifyGrading() {
    console.log("Starting AI Grading Verification...");

    const systemInstruction = `
    You are a STRICT MEDICAL EXAMINER.
    
    Task: Compare the student's written answers to the provided model answers for Case-Based Questions.
    
    Scoring rules (Apply to EACH sub-question):
    - Score 1.0 → if the student answer expresses the SAME clinical meaning as the model answer.
    - Score 0.5 → if the answer is PARTIALLY correct but missing an essential clinical element.
    - Score 0.0 → if incorrect, vague, or contradicts the model answer.

    Strict Guidelines:
    - Accept equivalent medical terminology and synonyms.
    - Do NOT require identical wording.
    - CLINICAL MEANING vs. CONFIDENCE: Do NOT penalize hesitant phrasing. IGNORE prefixes like "I think", "Probably", "Could be", "Maybe", "i think it is". If the student identifies the correct clinical concept, award 1.0 regardless of their perceived confidence level.
    - If the student says "Could be [Correct Dx]", they get 1.0. Correctness is about CONTENT, not CERTAINTY.
    - Do NOT infer missing information.
    - If any key concept is missing → do NOT give full marks.
    - Be strict and exam-focused on CLINICAL ACCURACY, not the student's tone or professional persona.
    - Ignore echoed question labels/stems (e.g. if the question is "ALP:" and student writes "ALP: High", grade the "High").
    - Accept minor word truncations or typos if the clinical meaning is obvious (e.g. "fractu" = "fracture" → 1.0).
    - Strictly award 0.0 for nonsense, technical artifacts (e.g. "&rarr;"), or single fragments (e.g. "1 ->") that don't convey a medical answer.

    == GAP ANALYSIS (summary field) ==
    Write 3–5 plain-text sentences addressing the student DIRECTLY.

    == OUTPUT FORMAT ==
    Return ONLY valid JSON:
    {
      "questions": [
        {
          "id": 1,
          "points": 0,
          "subquestions": [
            { 
              "id": 101, 
              "score": 1.0, 0.5, or 0.0,
              "reason": "..." 
            }
          ]
        }
      ],
      "estimated_score": 0,
      "summary": "..."
    }
    `;

    const testCases = [
        {
            id: 1,
            stem: "A child with head trauma.",
            subQuestions: [
                {
                    id: 101,
                    question: "What is the most probable Dx?:",
                    modelAnswer: "Depressed Skull Fracture",
                    studentAnswer: "Could be depressed skull fracture."
                }
            ]
        },
        {
            id: 2,
            stem: "Immunization schedule.",
            subQuestions: [
                {
                    id: 201,
                    question: "Vaccines in Jordan at what age ?:",
                    modelAnswer: "9 months (Measles monovalent), 12 months (MMR 1), 18 months (MMR 2)",
                    studentAnswer: "could be 9 months (measles monovalent), 12 months (mmr 1), 18 months (mmr 2)."
                }
            ]
        },
        {
            id: 3,
            stem: "Developmental milestones.",
            subQuestions: [
                {
                    id: 301,
                    question: "At what developmental age (kicking ball)?:",
                    modelAnswer: "2 years",
                    studentAnswer: "i think it is 2 years.??"
                },
                {
                    id: 302,
                    question: "At what developmental age (interactive play)?:",
                    modelAnswer: "3 years",
                    studentAnswer: "Could be 3 years??"
                }
            ]
        }
    ];

    const userPrompt = `
    Grade the following Case-Based Questions:
    ${JSON.stringify(testCases, null, 2)}
    `;

    try {
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
        console.log("Verification results:", JSON.stringify(result, null, 2));
        
        // Brief check
        const scores = result.questions.flatMap(q => q.subquestions.map(sq => sq.score));
        const allFullMarks = scores.every(s => s === 1.0);
        
        if (allFullMarks) {
            console.log("\nSUCCESS: All test cases passed with 1.0 score!");
        } else {
            console.warn("\nWARNING: Some test cases did not receive full marks.");
        }
    } catch (error) {
        console.error("Verification failed:", error);
    }
}

verifyGrading();
