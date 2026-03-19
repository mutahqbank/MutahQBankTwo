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
  try {
    // 1. Security Check (Runs on server) with Retry
    let user = await getServerUser();
    
    // Tiny retry to handle transient DB connection spikes
    if (!user) {
      console.log("AI Action: First auth attempt failed, retrying in 500ms...");
      await new Promise(r => setTimeout(r, 500));
      user = await getServerUser();
    }

    if (!user) {
      console.error("AI Action: Authentication failed after retry.");
      return { 
        success: false, 
        reasoning: "Session Error: Could not verify your instructor permissions. Please refresh the page if this persists." 
      };
    }

    if (user.role !== "admin" && user.role !== "instructor") {
      return { success: false, reasoning: "Access Denied: AI classification is restricted to admin/instructor roles." };
    }

    // 2. Data Preparation
    const subjectsRes = await query(`
      SELECT id, subject as name, description 
      FROM subjects 
      WHERE course_id = $1 AND active = true
    `, [courseId]);

    const subjects = subjectsRes.rows || [];
    const filteredSubjects = subjects
      .filter(s => {
        const name = (s.name || "").toLowerCase();
        return name && !name.includes("unclassified pool") && !name.includes("---");
      })
      .map(s => ({
        id: s.id,
        name: s.name || "Unknown",
        description: s.description
      }));

    console.log(`AI Classification for ${courseName} - Subjects: ${filteredSubjects.length}`);

    // 3. Call OpenAI Service
    const aiResult = await suggestCategoryWithOpenAI(
      question,
      explanation || "",
      options || [],
      filteredSubjects,
      courseName
    );

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
  } catch (error: any) {
    console.error("Critical AI Action Error:", error);
    return {
      lectureId: 0,
      reasoning: `Server Error: ${error.message || "Failed to process AI classification."}`,
      success: false
    };
  }
}

