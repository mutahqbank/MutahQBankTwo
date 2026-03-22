import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"
import { suggestCategoryWithOpenAI } from "@/lib/openai"

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    console.error("AI Classification Access Denied. User:", user ? `ID ${user.id}, Role ${user.role}` : "None (Session missing)");
    return NextResponse.json({ 
      error: user ? `Access Denied: Role is ${user.role}` : "Session expired or missing. Please refresh the page." 
    }, { status: 401 })
  }

  try {
    const key = process.env.OPENAI_API_KEY;
    console.log(`AI Classification Attempt (OpenAI). Key starts with: ${key ? key.substring(0, 10) + "****" : "MISSING"}`);
    const { question, subjects, explanation, courseName, options } = await request.json()

    if (!question || !subjects || !Array.isArray(subjects)) {
      return NextResponse.json({ error: "question and subjects array are required" }, { status: 400 })
    }

    const filteredSubjects = subjects
      .filter((s: any) => {
        const name = s.subject || s.name || ""
        if (name.toLowerCase().includes("unclassified pool")) return false
        if (name.trim() === "---") return false
        if (s.is_restricted) return false
        return name.trim().length > 1
      })
      .map((s: any) => ({ id: s.id, name: (s.subject || s.name).replace(/[⬇️⬆️⬅️➡️]/g, '').trim(), description: s.description || undefined }))

    // 2. Try OpenAI AI classification
    const aiResult = await suggestCategoryWithOpenAI(
      question,
      explanation || "",
      options || [],
      filteredSubjects,
      courseName || "Medical Course"
    )

    if (aiResult && aiResult.lectureId > 0) {
      return NextResponse.json({
        suggested_subject_id: aiResult.lectureId,
        reasoning: aiResult.reasoning,
        confidence: "high",
        method: "openai"
      })
    }

    return NextResponse.json({ 
      suggested_subject_id: null,
      reasoning: aiResult?.reasoning || "No clear medical match found by AI.",
      confidence: "none",
      method: "openai"
    })
  } catch (error: any) {
    console.error("AI Classification failed (OpenAI):", error)
    return NextResponse.json({ 
      error: "AI service currently unavailable", 
      details: error.message 
    }, { status: 500 })
  }
}
