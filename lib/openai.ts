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

  // 1. Helpers for data cleaning
  const cleanHtml = (html: string) => (html || "").replace(/<[^>]*>?/gm, '').trim();
  const peekExplanationTitle = (html: string) => {
    if (!html) return "";
    const headerMatch = /<(h[1-6]|b|strong)>(.*?)<\/\1>/i.exec(html);
    if (headerMatch && headerMatch[2]) {
      return cleanHtml(headerMatch[2]).substring(0, 80);
    }
    return cleanHtml(html).substring(0, 80);
  };

  const topicalHint = peekExplanationTitle(explanation);
  const cleanExplanation = cleanHtml(explanation).substring(0, 1000);
  const formattedOptions = options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(", ");

  // === STEP 1: AI FILTERING (Narrow down to Top 10) ===
  const lectureListBrief = lectures.map(l => `[ID ${l.id}] ${l.name}`).join("\n");

  const filterPrompt = `
    You are a Medical Triage Assistant. 
    Analyze the MCQ and identify the TOP 10 most likely Lecture Topics from the list below.
    
    MCQ:
    - Question: "${question}"
    - Options: ${formattedOptions}
    - Clinical Pearls: "${cleanExplanation}"
    - Topic Hint: "${topicalHint}"
    
    AVAILABLE LECTURES:
    ${lectureListBrief}
    
    Return ONLY a JSON array of the 10 most relevant Lecture IDs:
    { "candidateIds": [ID, ID, ...] }
  `;

  try {
    const filterResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a precise medical classifier. Focus on finding every potentially relevant ID." },
        { role: "user", content: filterPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const filterResult = JSON.parse(filterResponse.choices[0].message.content || "{}");
    const candidateIds = (filterResult.candidateIds || []).map(Number);
    
    const candidates = lectures.filter(l => candidateIds.includes(Number(l.id)));
    const finalCandidates = candidates.length > 0 ? candidates : lectures.slice(0, 15);

    // === STEP 2: DEEP CLINICAL MAPPING (Final Selection) ===
    const structuredCandidates = finalCandidates.map(l => {
      return `- [ID ${l.id}] ${l.name} ${l.description ? `(Knowledge: ${l.description.substring(0, 800)})` : ""}`;
    }).join("\n");

    const mappingInstruction = `
      You are a Senior Medical Specialist. Map this MCQ to the SINGLE BEST Lecture ID.
      
      MCQ DATA:
      - Question: "${question}"
      - Options: ${formattedOptions}
      - Explanation: "${cleanExplanation}"
      - Context: "${topicalHint}"
      
      NARROWED CANDIDATES:
      ${structuredCandidates}
      
      RULES:
      1. Choose the most specific lecture.
      2. Use the "Knowledge" hints to match clinical hallmarks.
      3. If no match is perfect, pick the most relevant parent category from the list.
      4. Return confidenceScore (0-100). Only 100 if CERTAIN.
      
      Return ONLY JSON:
      { 
        "reasoning": "...", 
        "lectureId": [ID],
        "confidenceScore": [0-100],
        "suggestions": [
          { "id": [ID], "name": "...", "reasoning": "..." },
          { "id": [ID], "name": "...", "reasoning": "..." },
          { "id": [ID], "name": "...", "reasoning": "..." }
        ],
        "descriptionUpdate": "Optional Clinical Pearl (brief phrase)"
      }
    `;

    const mappingResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a Senior Medical Classifier. Accuracy is paramount." },
        { role: "user", content: mappingInstruction },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(mappingResponse.choices[0].message.content || "{}");

    // Clean up suggestions
    const cleanedSuggestions = (result.suggestions || [])
      .map((s: any) => {
        const lect = lectures.find(l => Number(l.id) === Number(s.id));
        return lect ? { id: lect.id, name: lect.name, reasoning: s.reasoning } : null;
      })
      .filter(Boolean);

    const winner = lectures.find(l => Number(l.id) === Number(result.lectureId));

    return {
      reasoning: result.reasoning || "Matched based on clinical context.",
      lectureId: winner ? winner.id : 0,
      confidenceScore: result.confidenceScore || 0,
      suggestions: cleanedSuggestions,
      descriptionUpdate: result.descriptionUpdate || null
    };

  } catch (error) {
    console.error("2-Step AI classification failed:", error);
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
      // For CBQs, only send to AI if there is at least one answer (others are automatic zero)
      const hasAnswers = q.sub_questions.some(sq => {
        const ans = userCbqAnswers[q.id]?.[sq.id];
        return ans && ans.trim().length > 0;
      });

      if (hasAnswers) {
        // HARD LIMIT: Only evaluate up to 10 CBQs per exam mode
        if (relevantCbqs.length >= 10) continue; 
        
        relevantCbqs.push({
          id: q.id,
          stem: q.question_text?.replace(/<[^>]*>?/gm, '').trim().substring(0, 600),
          explanation: q.explanation_html
            ? q.explanation_html.replace(/<[^>]*>?/gm, '').trim().substring(0, 600)
            : undefined,
          subQuestions: q.sub_questions.map(sq => ({
            id: sq.id,
            question: sq.subquestion_text.replace(/<[^>]*>?/gm, '').trim().substring(0, 200),
            modelAnswer: sq.answer_html.replace(/<[^>]*>?/gm, '').trim().substring(0, 300),
            studentAnswer: (userCbqAnswers[q.id]?.[sq.id] || "").trim().substring(0, 300)
          }))
        });
      }
    }
  }

  const systemInstruction = `
    You are a STRICT MEDICAL EXAMINER.
    
    Task: Compare the student's written answers to the provided model answers for Case-Based Questions.
    
    Strict Guidelines:
    - Accept equivalent medical terminology and synonyms.
    - Do NOT require identical wording.
    - CLINICAL MEANING vs. CONFIDENCE: Do NOT penalize hesitant phrasing. IGNORE prefixes like "I think", "Probably", "Could be", "Maybe", "i think it is". If the student identifies the correct clinical concept, award 1.0 regardless of their perceived confidence level.
    - If the student says "Could be [Correct Dx]", they get 1.0. Correctness is about CONTENT, not CERTAINTY.
    - Do NOT infer missing information.
    - If any key concept is missing → do NOT give full marks.
    - Be strict and exam-focused on CLINICAL ACCURACY, not the student's tone or professional persona.
    - Ignore echoed question labels/stems (e.g. if the question is "ALP:" and student writes "ALP: High", grade the "High").
    - TRUNCATED WORDS: Award at least 0.5 credit (up to 1.0) if a word is only partially written but the intended clinical concept is clear (e.g. "fractu" for "fracture", "depres" for "depressed"). Be generous if the intention is obvious.
    - Strictly award 0.0 for nonsense, technical artifacts (e.g. "&rarr;"), or single fragments (e.g. "1 ->") that don't convey a medical answer.

    == GAP ANALYSIS (summary field) ==
    Write 3–5 plain-text sentences addressing the student DIRECTLY (using "You", "Your"):
    - Honesty about their performance.
    - Two or three specific clinical gaps from wrong answers.
    - Targeted revision tips.
    - Supportive but professional closing line.
    Tone: direct and honest. No third-person. No markdown.

    == OUTPUT FORMAT ==
    Return ONLY valid JSON in this exact structure:
    {
      "questions": [
        {
          "id": <question_id>,
          "points": 0,
          "subquestions": [
            { 
              "id": <subquestion_id>, 
              "score": 1.0, 0.5, or 0.0,
              "reason": "one short sentence explaining why" 
            }
          ]
        }
      ],
      "estimated_score": 0,
      "summary": "<the gap analysis text>"
    }
  `;

  const userPrompt = `
    Grade the following Case-Based Questions. For each sub-question, compare the student's answer to the model answer by MEANING, not wording.

    MCQ PERFORMANCE SUMMARY (per subject, for the Gap Analysis):
    ${Object.entries(mcqSummary).map(([s, c]) => `${s}: ${c.correct}/${c.total} correct`).join('\n') || "No MCQs"}

    CASE-BASED QUESTIONS TO GRADE:
    ${JSON.stringify(relevantCbqs, null, 2)}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction + " Respond ONLY with valid JSON. Be professional, supportive, and clinically precise." },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 8000,
      temperature: 0.2,
    });

    const text = response.choices[0].message.content || "{}";
    const result = JSON.parse(text);

    // Deterministic Score Calculation
    let targetTotalMax = 0;
    let targetTotalEarned = 0;

    // 1. Add MCQs
    for (const subject in mcqSummary) {
      targetTotalMax += mcqSummary[subject].total;
      targetTotalEarned += mcqSummary[subject].correct;
    }

    // 2. Add CBQs (each CBQ's max score is its sub_question length)
    for (const q of questions) {
      const isCBQ = q.sub_questions.length > 0;
      if (isCBQ) {
        const cbqMax = q.sub_questions.length;
        targetTotalMax += cbqMax;
        
        const aiScoreObj = result.questions?.find((qr: any) => Number(qr.id) === Number(q.id));
        
        if (aiScoreObj && Array.isArray(aiScoreObj.subquestions)) {
          // Deterministically grade the CBQ based entirely on the subquestions array.
          // This prevents contradictory checkmarks vs total score hallucinations.
          let correctCount = 0;
          aiScoreObj.subquestions.forEach((sqRes: any) => {
            if (typeof sqRes.score === 'number') {
              correctCount += sqRes.score;
            } else if (sqRes.is_correct === true) {
              correctCount += 1; // Fallback for previous cached JSON format
            }
          });
          
          aiScoreObj.points = correctCount / cbqMax;
          targetTotalEarned += correctCount;
        } else if (aiScoreObj && typeof aiScoreObj.points === "number") {
          // Fallback if subquestions array failed to generate
          targetTotalEarned += (aiScoreObj.points * cbqMax);
        }
      }
    }

    // 3. Overall calculation
    if (targetTotalMax > 0) {
      result.estimated_score = Math.round((targetTotalEarned / targetTotalMax) * 100);
    } else {
      result.estimated_score = 0;
    }

    return result;
  } catch (error: any) {
    console.error("OpenAI exam repair failed:", error?.message || error);
    return null;
  }
}

/**
 * AI CBQ Rubric Generation Logic
 * Evaluates CBQ stem, explanation, and subquestions to generate a strict scoring rubric.
 */
export async function generateCbqRubricWithOpenAI(
  cbqStem: string,
  cleanedExplanation: string,
  subquestionsWithModelAnswers: string
) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is missing. AI rubric generation will not work.");
    return null;
  }

  const systemInstruction = `
    You are an expert medical examiner designing rubrics for EXAM MODE scoring.

    Your task is to create a STRICT, FAIR, and CONSISTENT scoring rubric for each sub-question in a clinical case-based question (CBQ).

    This rubric will be used to grade student answers in an EXAM setting.

    EXAM MODE RULES:
    - Only award marks for what is explicitly stated.
    - Do NOT assume missing knowledge.
    - Do NOT infer unstated reasoning.
    - Be strict but fair.
    - Accept standard clinical synonyms, but not vague or ambiguous answers.
    - Penalize incorrect or unsafe statements.
    - Partial credit should be LIMITED and justified.

    INPUTS:
    - CBQ stem
    - Cleaned explanation (from explanation_html)
    - Sub-questions with model answers

    GOAL:
    Convert the explanation + model answers into a COMPACT grading rubric optimized for automated scoring.

    DO NOT:
    - write explanations
    - include teaching content
    - repeat the original explanation
    - include HTML
    - produce long text

    RUBRIC DESIGN:

    For EACH sub-question, extract:

    1. required_concepts
       - essential for full marks
       - must be explicitly stated
       - keep precise and minimal

    2. acceptable_alternatives
       - valid equivalent terminology
       - accepted synonyms only

    3. optional_concepts
       - extra correct details
       - should NOT compensate for missing required concepts

    4. partial_credit_concepts
       - incomplete, indirect, or non-definitive answers
       - should earn limited marks only

    5. critical_errors
       - incorrect diagnoses
       - incorrect investigations
       - unsafe or wrong management
       - contradictions

    6. disallowed_overcredit
       - statements that are true but irrelevant
       - should NOT earn marks alone

    STRICTNESS RULES:
    - If the question expects a specific answer, keep rubric narrow.
    - Do NOT reward vague answers (e.g., "do tests", "biopsy" without specification if specificity matters).
    - Do NOT reward partially correct answers as full marks.
    - Required concepts must be clearly identifiable in student answers.
    - Avoid duplication between fields.

    STRICT OUTPUT RULES:
    - Do NOT over-generate concepts.
    - Do NOT include more than 5 required_concepts.
    - Prefer fewer, more precise concepts.
    - Do NOT duplicate concepts across fields.
    - If unsure, place concept in optional_concepts, not required.
    - critical_errors must only include clearly wrong or unsafe statements.
    - Avoid vague concepts like "do tests", "further investigation".

    COMPACTNESS RULES:
    - Keep each concept short (prefer <8 words)
    - Avoid long sentences
    - Avoid redundancy
    - Keep token usage minimal

    OUTPUT FORMAT:
    Return ONLY valid JSON.
    {
      "cbq_summary": "max 30-40 words, optional",
      "subquestions": [
        {
          "subquestion_index": 1,
          "question_focus": "short phrase",
          "max_score": 5,
          "required_concepts": [],
          "acceptable_alternatives": [],
          "optional_concepts": [],
          "partial_credit_concepts": [],
          "critical_errors": [],
          "disallowed_overcredit": []
        }
      ]
    }

    ERROR HANDLING:
    - If explanation and model answer differ, prioritize clinically correct and exam-relevant answer.
    - Do NOT hallucinate uncommon details.
    - If unclear, prefer stricter rubric over permissive one.
  `;

  const userPrompt = `
    INPUT:
    CBQ_STEM:
    ${cbqStem}

    CLEANED_EXPLANATION:
    ${cleanedExplanation}

    SUBQUESTIONS:
    ${subquestionsWithModelAnswers}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use gpt-4o for high fidelity if required
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
      temperature: 0.1, // Low temperature for consistent rubrics
    });

    const text = response.choices[0].message.content || "{}";
    return JSON.parse(text);
  } catch (error: any) {
    console.error("OpenAI CBQ rubric generation failed:", error?.message || error);
    return null;
  }
}

/**
 * AI CBQ Rubric Refinement Logic
 * Reviews a generated medical exam rubric and improves its precision, brevity, and structure.
 */
export async function refineCbqRubricWithOpenAI(
  originalRubricJson: string
) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is missing. AI rubric refinement will not work.");
    return null;
  }

  const systemInstruction = `
    You are reviewing a medical exam rubric.

    Fix:
    - duplicated concepts
    - overly broad required_concepts
    - missing critical_errors
    - vague wording

    Return improved JSON only.
  `;

  const userPrompt = `
    ORIGINAL RUBRIC JSON:
    ${originalRubricJson}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use gpt-4o for high fidelity if required
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
      temperature: 0.1, // Low temperature for consistent refinement
    });

    const text = response.choices[0].message.content || "{}";
    return JSON.parse(text);
  } catch (error: any) {
    console.error("OpenAI CBQ rubric refinement failed:", error?.message || error);
    return null;
  }
}

/**
 * AI Paraphrasing Logic for Dev Test
 * Generates semantic equivalents of model answers to test AI evaluation.
 */
export async function paraphraseAnswersWithOpenAI(
  data: { id: string | number; question: string; answer: string }[]
) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is missing. AI paraphrasing will not work.");
    return null;
  }

  const systemInstruction = `
    You are a professional medical student.
    
    Task: Paraphrase the medical answers.
    Rules:
    - Keep the EXACT same clinical meaning.
    - If the question asks for multiple options (e.g., "Give 2 causes"), you MUST provide that many options separated by commas.
    - EACH individual option MUST be max 2 words.
    - If it's a single-answer question, provide exactly 1 word or a 2-word term. 
    - BE EXTREMELY CONCISE. 
    - Use different wording and medical synonyms.
    - Return a JSON object where keys are the original IDs and values are the paraphrased strings.
    - Format: { "ID": "paraphrased text" }
  `;

  const userPrompt = `
    Paraphrase these answers based on the questions:
    ${JSON.stringify(data)}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7, // Higher temperature for varied paraphrasing
    });

    const text = response.choices[0].message.content || "{}";
    return JSON.parse(text);
  } catch (error: any) {
    console.error("OpenAI paraphrasing failed:", error?.message || error);
    return null;
  }
}

/**
 * AI Incorrect Answer Generation Logic for Dev Test
 * Generates clinically incorrect but linguistically similar answers to test AI precision.
 */
export async function generateIncorrectAnswersWithOpenAI(
  answers: { id: string | number; text: string }[]
) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is missing. AI incorrect generation will not work.");
    return null;
  }

  const systemInstruction = `
    You are a deceptive medical examiner.
    
    Task: Generate "Similar but Wrong" medical answers.
    Rules:
    - The answer must be CLINICALLY INCORRECT for the same clinical context.
    - Use wording that is LINGUISTICALLY SIMILAR to the original answer.
    - Use related but wrong medical terms (e.g., "Hypokalemia" -> "Hyperkalemia", "Increase dose" -> "Decrease dose", "Left" -> "Right").
    - If the original is a specific diagnosis, use a plausible but wrong alternative in the same class.
    - BE EXTREMELY CONCISE. You MUST provide exactly 2 to 3 words.
    - Do NOT include any explanations.
    - Return a JSON object where keys are the original IDs and values are the incorrect strings.
    - Format: { "ID": "incorrect text" }
  `;

  const userPrompt = `
    Generate "Similar but Wrong" answers for these medical answers:
    ${JSON.stringify(answers)}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const text = response.choices[0].message.content || "{}";
    return JSON.parse(text);
  } catch (error: any) {
    console.error("OpenAI incorrect generation failed:", error?.message || error);
    return null;
  }
}

/**
 * AI Lecture Description Differentiation Logic
 * Rewrites lecture descriptions as a coordinated set to minimize overlap for MCQ classification.
 */
export async function differentiateDescriptionsWithOpenAI(
  lectures: { title: string; description: string }[]
) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is missing. AI description differentiation will not work.");
    return null;
  }

  const systemPrompt = `
You are editing ONLY the AI descriptions of lecture cards for an MCQ classification system.

Your task:
Rewrite the descriptions so each lecture is clearly distinguishable from the others, with the least possible overlap.

Critical constraints:
- Modify ONLY lecture descriptions.
- Do NOT change lecture titles.
- Do NOT change question counts.
- Do NOT reorder lectures.
- Do NOT change lock/restrict states.
- Do NOT change any UI text, labels, colors, buttons, layout, IDs, metadata, or any other field.
- Do NOT create, delete, merge, split, hide, or rename lectures.
- Do NOT manipulate anything else in the screen data.
- Output only the updated descriptions mapped to their original lecture titles.

Optimization target:
These descriptions are used by another AI to classify unclassified MCQs into the correct lecture.
Therefore:
- Minimize overlap across lectures as much as possible
- Make each description uniquely identifying
- Prefer features that help separate neighboring/similar lectures
- Remove generic broad wording
- Avoid repeating the same keywords across multiple lectures unless unavoidable
- Make the whole set mutually exclusive as much as medically reasonable

Writing rules:
- Each description MUST be 5 to 10 words
- Use extremely concise hallmark keywords, not sentences
- Focus on discriminators: hallmark presentation, core diagnosis clues, classic associations, signature investigations
- Be VERY VERY specific to the lecture title
- Avoid vague phrases like "management", "important concepts", "common causes"
- Do not invent topics not justified by the title
- Preserve medical correctness
- English only

Before finalizing, internally check:
1. Did you return every lecture exactly once?
2. Did you modify only descriptions?
3. Are any two descriptions still easily confusable?
4. Did you remove broad overlapping terms where possible?
5. Is each description VERY short, VERY specific, and classification-oriented?

Return JSON only in this exact format:
{
  "lectures": [
    {
      "title": "exact original title",
      "description": "new tightly differentiated description"
    }
  ]
}
`;

  const userPrompt = `
Rewrite the following lecture descriptions as a single coordinated set for AI-based MCQ classification.

Goal:
Produce new descriptions with near-zero overlap between lectures wherever medically possible.
The descriptions must help another AI assign questions to the correct lecture and avoid false classification.

Instructions:
- Read the full set first
- Rewrite all descriptions together, not one by one
- Keep only the description field changed
- Preserve every title exactly
- Make similar lectures sharply separated
- If a lecture title is broad, define its scope narrowly enough to reduce collision with neighboring lectures
- If a lecture title is already inherently overlapping with another title, still rewrite both descriptions to minimize confusion as much as possible without changing titles
- Return all lectures
- Return JSON only

Lecture data:
${JSON.stringify(lectures, null, 2)}
`;

  const callOpenAI = async (model: string) => {
    console.log(`Calling OpenAI with model: ${model}`);
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for consistency
    });

    const text = response.choices[0].message.content || "{}";
    const result = JSON.parse(text);
    
    // Basic validation: ensure it has the "lectures" array and titles match
    if (!result.lectures || !Array.isArray(result.lectures)) {
      throw new Error("Invalid response format: missing lectures array");
    }
    
    return result;
  };

  try {
    return await callOpenAI("gpt-4o");
  } catch (error: any) {
    console.error("OpenAI knowledge generation (differentiation) failed:", error?.message || error);
    return null;
  }
}
