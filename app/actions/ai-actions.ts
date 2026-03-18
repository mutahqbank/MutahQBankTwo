'use server'

import { suggestCategoryWithGemini } from "@/lib/gemini";
import { query } from "@/lib/database";
import { getServerUser } from "@/lib/auth-server";

/**
 * Server Action for AI Question Classification
 * Follows the user's architectural spec for server-side AI processing.
 */
export async function suggestCategoryAction(
  question: string,
  explanation: string,
  options: string[],
  subjects: { id: number; name: string; description?: string }[],
  courseName: string
) {
  // 1. Security Check (Runs on server)
  const user = await getServerUser();
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    throw new Error("Unauthorized: AI classification requires admin or instructor role.");
  }

  // 2. Data Preparation
  // Ensure we only pass the necessary lightweight lecture data to the AI service
  const filteredSubjects = subjects
    .filter(s => {
      const name = s.name.toLowerCase();
      const hasEmoji = /\p{Emoji}/u.test(name) && !/^\d+$/.test(name); // Exclude things that are just emojis/symbols but keep pure numbers if they exist
      return !name.includes("unclassified pool") && !name.includes("---") && !hasEmoji;
    });

  // 3. Call Gemini Service (Deterministic + Clinical Inference)
  const aiResult = await suggestCategoryWithGemini(
    question,
    explanation || "",
    options || [],
    filteredSubjects,
    courseName
  );

  // 4. Return the result directly to the Client Component
  if (aiResult && aiResult.lectureId > 0) {
    return {
      lectureId: aiResult.lectureId,
      reasoning: aiResult.reasoning,
      success: true
    };
  }

  return {
    lectureId: 0,
    reasoning: aiResult?.reasoning || "Could not find a specific clinical match.",
    success: false
  };
}
