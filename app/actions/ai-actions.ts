'use server'

import { suggestCategoryWithOpenAI, extractClinicalPearlWithOpenAI, repairExamWithOpenAI, generateCbqRubricWithOpenAI, refineCbqRubricWithOpenAI, paraphraseAnswersWithOpenAI, generateIncorrectAnswersWithOpenAI, differentiateDescriptionsWithOpenAI } from "@/lib/openai";
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
        name: (s.name || "Unknown").replace(/[⬇️⬆️⬅️➡️]/g, '').trim(),
        description: s.description
      }));

    console.log(`AI Classification for ${courseName} - Subjects: ${filteredSubjects.length}`);
    console.log("Subjects List (First 200):", filteredSubjects.map(s => `[ID ${s.id}] ${s.name}`).join(", "));

    // 3. Call OpenAI Service
    const aiResult = await suggestCategoryWithOpenAI(
      question,
      explanation || "",
      options || [],
      filteredSubjects,
      courseName
    );

    if (aiResult && (aiResult.lectureId > 0 || (aiResult.suggestions && aiResult.suggestions.length > 0))) {
      // 4. Background Learning (Self-Edition)
      if (aiResult.lectureId > 0 && aiResult.descriptionUpdate) {
        try {
          // Fetch current description
          const currRes = await query(`SELECT description FROM subjects WHERE id = $1`, [aiResult.lectureId]);
          const currentDesc = currRes.rows[0]?.description || "";
          
          // Append new info if not already present
          if (!currentDesc.toLowerCase().includes(aiResult.descriptionUpdate.toLowerCase().substring(0, 20))) {
            const newDesc = currentDesc 
              ? `${currentDesc}\n\nClinical Pearl: ${aiResult.descriptionUpdate}` 
              : `Clinical Pearl: ${aiResult.descriptionUpdate}`;
              
            await query(`UPDATE subjects SET description = $1 WHERE id = $2`, [newDesc, aiResult.lectureId]);
            console.log(`AI: Self-edited lecture ${aiResult.lectureId} description.`);
          }
        } catch (dbErr) {
          console.error("AI Learning Error (Background):", dbErr);
        }
      }

      return {
        lectureId: aiResult.lectureId,
        reasoning: aiResult.reasoning,
        suggestions: aiResult.suggestions || [],
        confidenceScore: aiResult.confidenceScore || 0,
        learned: !!aiResult.descriptionUpdate,
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


/**
 * Server Action for AI Exam Repair
 */
export async function repairExamAction(
  questions: any[],
  userAnswers: Record<number, number>,
  userCbqAnswers: Record<number, Record<number, string>>,
  courseName: string
) {
  try {
    const user = await getServerUser();
    if (!user) return { success: false, reasoning: "Authentication required." };

    const result = await repairExamWithOpenAI(
      questions,
      userAnswers,
      userCbqAnswers,
      courseName
    );

    if (result) {
      return { success: true, ...result };
    }
    return { success: false, reasoning: "Failed to process AI repair." };
  } catch (error: any) {
    console.error("AI Repair Action Error:", error);
    return { success: false, reasoning: error.message };
  }
}

/**
 * Server Action for AI CBQ Rubric Generation
 */
export async function generateCbqRubricAction(
  cbqStem: string,
  cleanedExplanation: string,
  subquestionsWithModelAnswers: string
) {
  try {
    const user = await getServerUser();
    if (!user) return { success: false, reasoning: "Authentication required." };

    if (user.role !== "admin" && user.role !== "instructor") {
      return { success: false, reasoning: "Access Denied: AI rubric generation is restricted to admin/instructor roles." };
    }

    const result = await generateCbqRubricWithOpenAI(
      cbqStem,
      cleanedExplanation,
      subquestionsWithModelAnswers
    );

    if (result) {
      return { success: true, rubric: result };
    }
    return { success: false, reasoning: "Failed to generate AI rubric." };
  } catch (error: any) {
    console.error("AI Rubric Generation Action Error:", error);
    return { success: false, reasoning: error.message };
  }
}

/**
 * Server Action for AI CBQ Rubric Refinement
 */
export async function refineCbqRubricAction(
  originalRubricJson: string
) {
  try {
    const user = await getServerUser();
    if (!user) return { success: false, reasoning: "Authentication required." };

    if (user.role !== "admin" && user.role !== "instructor") {
      return { success: false, reasoning: "Access Denied: AI rubric refinement is restricted to admin/instructor roles." };
    }

    const result = await refineCbqRubricWithOpenAI(originalRubricJson);

    if (result) {
      return { success: true, rubric: result };
    }
    return { success: false, reasoning: "Failed to refine AI rubric." };
  } catch (error: any) {
    console.error("AI Rubric Refinement Action Error:", error);
    return { success: false, reasoning: error.message };
  }
}

/**
 * Server Action for AI Paraphrasing (Dev Test)
 */
export async function paraphraseAnswersAction(
  data: { id: string | number; question: string; answer: string }[]
) {
  try {
    const user = await getServerUser();
    if (!user) return { success: false, reasoning: "Authentication required." };
    if (user.role !== "admin") return { success: false, reasoning: "Access restricted to admins." };

    const result = await paraphraseAnswersWithOpenAI(data);
    if (result) {
      return { success: true, paraphrasedAnswers: result };
    }
    return { success: false, reasoning: "Failed to paraphrase answers." };
  } catch (error: any) {
    console.error("AI Paraphrasing Action Error:", error);
    return { success: false, reasoning: error.message };
  }
}
/**
 * Server Action for AI Incorrect Generation (Dev Test)
 */
export async function generateIncorrectAction(
  answers: { id: string | number; text: string }[]
) {
  try {
    const user = await getServerUser();
    if (!user) return { success: false, reasoning: "Authentication required." };
    if (user.role !== "admin") return { success: false, reasoning: "Access restricted to admins." };

    const result = await generateIncorrectAnswersWithOpenAI(answers);
    if (result) {
      return { success: true, incorrectAnswers: result };
    }
    return { success: false, reasoning: "Failed to generate incorrect answers." };
  } catch (error: any) {
    console.error("AI Incorrect Action Error:", error);
    return { success: false, reasoning: error.message };
  }
}

/**
 * Server Action for AI Lecture Description Differentiation
 */
export async function differentiateDescriptionsAction(
  lectures: { title: string; description: string }[]
) {
  try {
    const user = await getServerUser();
    if (!user) return { success: false, reasoning: "Authentication required." };

    if (user.role !== "admin" && user.role !== "instructor") {
      return { success: false, reasoning: "Access Denied: This feature is restricted to admin/instructor roles." };
    }

    const result = await differentiateDescriptionsWithOpenAI(lectures);

    if (result && result.lectures) {
      return { success: true, lectures: result.lectures };
    }

    return { success: false, reasoning: "Failed to process AI differentiation." };
  } catch (error: any) {
    console.error("AI Differentiation Action Error:", error);
    return { success: false, reasoning: error.message };
  }
}

/**
 * Learns from a manual move by an instructor.
 * Extracts a clinical pearl and adds it to the target subject description.
 */
export async function learnFromManualMoveAction(
  question: string,
  explanation: string,
  options: string[],
  subjectId: number
) {
  try {
    const user = await getServerUser();
    if (!user || (user.role !== "admin" && user.role !== "instructor")) {
      return { success: false };
    }

    const pearl = await extractClinicalPearlWithOpenAI(question, explanation, options);
    if (!pearl) return { success: false };

    // Fetch current description
    const currRes = await query(`SELECT description FROM subjects WHERE id = $1`, [subjectId]);
    if (currRes.rows.length === 0) return { success: false };
    const currentDesc = currRes.rows[0].description || "";

    // Avoid duplication
    if (!currentDesc.toLowerCase().includes(pearl.toLowerCase().substring(0, 15))) {
      const newDesc = currentDesc 
        ? `${currentDesc}\n\nClinical Pearl: ${pearl}` 
        : `Clinical Pearl: ${pearl}`;
        
      await query(`UPDATE subjects SET description = $1 WHERE id = $2`, [newDesc, subjectId]);
      console.log(`AI Learned from Manual Move: Added pearl to subject ${subjectId}`);
      return { success: true, pearl };
    }

    return { success: true, alreadyExists: true };
  } catch (error) {
    console.error("AI Learning Action Error:", error);
    return { success: false };
  }
}

