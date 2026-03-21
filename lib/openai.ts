import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * AI Auto-Classification logic for the Kitchen
 * Uses OpenAI to suggest the best lecture/subject for a given question.
 */
export async function suggestCategoryWithOpenAI(
  question: string,
  explanation: string,
  options: string[],
  lectures: { id: number; name: string; description?: string }[],
  courseName: string
) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is missing. AI classification will not work.");
    return null;
  }

  // 1. Clinical Data Enhancement (Helping the AI bridge terminology gaps)
  const synonymMap: Record<string, string> = {
    "urti": "Upper Respiratory Tract Infection, Pharyngitis, Tonsillitis, GAS, Common Cold",
    "pneumonia": "LRTIs, Lower Respiratory Infections, Consolidation",
    "meningitis": "CNS Infection, CSF analysis, Lumbar Puncture",
    "asthma": "Reactive Airway Disease, Wheezing",
    "nephrology": "Kidney, UTI, Glomerulonephritis",
    "hematology": "Anemia, Bleeding, Blood disorders",
    "neonatology": "Newborn, Prematurity, RDS",
    "gastroenterology": "GI, Diarrhea, GERD, Abdominal Pain",
    "endocrinology": "Diabetes, Thyroid, Puberty, Growth",
    "cardiology": "Heart, Cyanosis, Murmurs",
    "pulmonology": "Respiratory, Lungs, CF",
  };

  // 2. Data Preparation
  // Strip HTML tags and truncate to 1000 characters
  const cleanExplanation = explanation.replace(/<[^>]*>?/gm, '').substring(0, 1000);
  
  // Format options into a single string
  const formattedOptions = options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(", ");

  // Format lectures into lightweight structured list with synonym assistance
  const structuredLectures = lectures.map(l => {
    const rawName = l.name.toLowerCase();
    let enhancedName = l.name;
    
    // Check for partial or exact matches in synonym map
    Object.keys(synonymMap).forEach(key => {
      if (rawName.includes(key)) {
        enhancedName += ` (${synonymMap[key]})`;
      }
    });

    return `ID: ${l.id} | Topic: ${enhancedName} ${l.description ? `(Context: ${l.description.substring(0, 500)})` : ""}`;
  }).join("\n");

  const systemInstruction = `
    You are a Senior Medical Classifier specializing in pediatric and general medicine.
    
    CORE CLASSIFICATION LOGIC:
    1. Map the MCQ to the SINGLE most relevant Lecture Topic ID from the provided list.
    2. If a specific disease (e.g., "Meningitis", "Lumbar Puncture findings") doesn't have an exact topic, search for:
       - The Organ System: e.g., CNS/Brain/Nerves -> Neurology.
       - The Speciality: e.g., Pneumonia -> Respiratory.
       - The Parent Group: e.g., Polio -> Immunization.
    3. CRITICAL: If you see signs of bacterial infection in CSF (Low glucose, high protein, high neutrophils), this is Meningitis. Map this to "Neurology" or "Pediatric Infections".
    4. If multiple topics are relevant, choose the one where the question would most likely be lectured.
    
    5. DO NOT return 0 unless there are no subjects provided. Use your best clinical judgment to map to the most appropriate category, even if it's a broad parent discipline (e.g., Surgery, Medicine, Pediatrics).
    
    OUTPUT FORMAT:
    Return ONLY a JSON object:
    {
      "reasoning": "Brief medical link (e.g. CSF/Meningitis maps to Neurology)",
      "lectureId": [ID number]
    }
  `;

  const userPrompt = `
    Available Lectures:
    ${structuredLectures}
    
    MCQ for Classification:
    - Question: "${question}"
    - Options: ${formattedOptions}
    - Explanation (Clinical Pearls): "${cleanExplanation}"
  `;

  // Debug Logging
  console.log("--- AI CLASSIFICATION PROMPT (OpenAI) ---");
  console.log(userPrompt);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: systemInstruction + "\n\nCRITICAL: Use your advanced medical reasoning to determine the differential diagnosis before picking the lecture ID."
        },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices[0].message.content || "{}";
    console.log("--- AI RAW RESPONSE (OpenAI) ---");
    console.log(text);

    const result = JSON.parse(text);
    
    // Validation (Anti-Hallucination Check)
    const validId = lectures.find(l => Number(l.id) === Number(result.lectureId));
    
    if (validId) {
      return result;
    } else {
      return { 
        reasoning: result.reasoning || "No clear medical match found.", 
        lectureId: 0 
      };
    }
  } catch (error) {
    console.error("OpenAI classification failed:", error);
    return null;
  }
}

/**
 * AI Exam Repair Logic
 * Evaluates CBQ answers and provides an estimated score.
 */
export async function repairExamWithOpenAI(
  questions: { 
    id: number; 
    question_text: string; 
    explanation_html?: string; 
    sub_questions: { id: number; subquestion_text: string; answer_html: string }[];
    options: { id: number; option: string; correct: boolean }[];
  }[],
  userAnswers: Record<number, number>, // questionId -> optionId
  userCbqAnswers: Record<number, Record<number, string>>, // questionId -> subquestionId -> text
  courseName: string
) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is missing. AI repair will not work.");
    return null;
  }

  // Group MCQs by subject to save tokens (Gap Analysis only)
  const mcqSummary: Record<string, { correct: number; total: number }> = {};
  const relevantCbqs: any[] = [];

  for (const q of questions) {
    const isCBQ = q.sub_questions.length > 0;
    const isCorrectMCQ = !isCBQ && userAnswers[q.id] && q.options.find(o => o.id === userAnswers[q.id])?.correct;

    if (!isCBQ) {
      const subject = (q as any).subject_name || "General";
      if (!mcqSummary[subject]) mcqSummary[subject] = { correct: 0, total: 0 };
      mcqSummary[subject].total++;
      if (isCorrectMCQ) mcqSummary[subject].correct++;
    } else {
      relevantCbqs.push({
        id: q.id,
        text: q.question_text?.replace(/<[^>]*>?/gm, '').substring(0, 300),
        subQuestions: q.sub_questions.map(sq => ({
          id: sq.id,
          text: sq.subquestion_text.replace(/<[^>]*>?/gm, ''),
          correctAnswer: sq.answer_html.replace(/<[^>]*>?/gm, ''),
          userAnswer: userCbqAnswers[q.id]?.[sq.id] || ""
        }))
      });
    }
  }

  const systemInstruction = `
    You are a supportive, motivating Senior Medical Tutor. 
    
    TASK: Assess student performance from ${courseName}.
    
    COMPARISON & GRADING RULES (Tolerant & Clinical):
    - Focus on clinical meaning, not exact text matching.
    - Be tolerant: Accept synonyms, medical variants, and abbreviations.
    - Recognize partial credit for correct systems, patterns, or probable diagnoses.
    - Ignore spelling/grammar if meaning is clear.
    - Interpret "almost right" answers charitably.
    - Reward answers that are conceptually correct even if phrased differently.
    - Grade on scale 0 to 1.0.
    
    OUTPUT GOALS:
    1. AI Gap Analysis & Recommendations (Main Summary):
       - Start with one encouraging sentence.
       - Mention what the student got right/partially right first.
       - Describe the main medical gap clearly.
       - Give 2 to 3 focused, practical revision recommendations.
       - Keep it short, supportive, and high-yield.

    2. AI Evaluation (Per-Question Feedback):
       - 1 to 3 sentences in a "tutor" tone.
       - Briefly explain why it was correct, partial, or incorrect based on meaning.
       - End with encouragement.
    
    OUTPUT JSON:
    {
      "questions": [{ "id": [ID], "points": [0-1], "feedback": "AI Evaluation (1-3 sentences)" }],
      "estimated_score": [0-100],
      "summary": "AI Gap Analysis & Recommendations"
    }
  `;

  const userPrompt = `
    MCQ SUMMARY:
    ${Object.entries(mcqSummary).map(([s, c]) => `${s}: ${c.correct}/${c.total}`).join('\n')}

    CBQs FOR GRADING:
    ${JSON.stringify(relevantCbqs, null, 1)}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction + " Respond ONLY with valid JSON. Be professional, supportive, and precise." },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.5,
    });

    const text = response.choices[0].message.content || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("OpenAI exam repair failed:", error);
    return null;
  }
}
