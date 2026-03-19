'use server'

import { suggestCategoryWithOpenAI } from "@/lib/openai";
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
  courseId: number,
  courseName: string
) {
  // 1. Security Check (Runs on server)
  const user = await getServerUser();
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    throw new Error("Unauthorized: AI classification requires admin or instructor role.");
  }

  // 2. Data Preparation
  // Fetch subjects directly from DB since the client-side list might be too large (payload limits)
  const subjectsRes = await query(`
    SELECT id, subject as name, description 
    FROM subjects 
    WHERE course_id = $1 AND active = true
  `, [courseId]);

  const subjects = subjectsRes.rows;
  console.log(`AI Classification Request - User: ${user.username}, Course: ${courseName}, Subjects Found: ${subjects?.length}`);
  
  const filteredSubjects = (subjects || [])
    .filter(s => {
      const name = (s.name || "").toLowerCase();
      if (!name) return false;
      
      const hasEmoji = /\p{Emoji}/u.test(name) && !/^\d+$/.test(name);
      return !name.includes("unclassified pool") && !name.includes("---") && !hasEmoji;
    })
    .map(s => ({
      id: s.id,
      name: s.name || "Unknown",
      description: s.description
    }));

  console.log(`Filtered Subjects Count: ${filteredSubjects.length}`);

  // 3. Call OpenAI Service (Deterministic + Clinical Inference)
  const aiResult = await suggestCategoryWithOpenAI(
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

