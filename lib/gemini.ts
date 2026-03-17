import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * AI Auto-Classification logic for the Kitchen
 * Uses Gemini to suggest the best lecture/subject for a given question.
 */
export async function suggestCategoryWithGemini(
  question: string,
  explanation: string,
  lectures: { id: number; name: string }[],
  courseName: string
) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is missing. AI classification will not work.");
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.1, // Slight temperature for better reasoning fluidity
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          reasoning: {
            type: SchemaType.STRING,
            description: "Extremely concise medical reasoning (max 10 words)."
          },
          lectureId: {
            type: SchemaType.NUMBER,
            description: "Matching lecture ID."
          }
        },
        required: ["reasoning", "lectureId"]
      }
    }
  });

  const prompt = `
    Context: Medical Education Platform (${courseName})
    Task: Classify the following MCQ into the single most relevant lecture ID.
    
    Lectures:
    ${lectures.map(l => `${l.id}: ${l.name}`).join("\n")}
    
    Question: "${question}"
    Explanation: "${explanation}"
    
    Rules:
    1. Focus on core medical topics. 
    2. Ignore generic headers, emojis, or placeholder subjects.
    3. Return 0 for 'lectureId' if no specific match exists.
    4. Provide the result in the specified JSON format.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());
    
    // Validate that the returned ID actually exists in the provided list
    const validId = lectures.some(l => l.id === response.lectureId);
    
    if (validId) {
      return response;
    } else {
      console.warn(`AI suggested invalid lectureId: ${response.lectureId}`);
      return { reasoning: "AI suggested an invalid ID.", lectureId: 0 };
    }
  } catch (error) {
    console.error("Gemini classification failed:", error);
    return null;
  }
}
