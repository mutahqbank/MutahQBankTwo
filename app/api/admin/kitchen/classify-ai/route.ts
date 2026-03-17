import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"
import { suggestCategoryWithGemini } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    console.error("AI Classification Access Denied. User:", user ? `ID ${user.id}, Role ${user.role}` : "None (Session missing)");
    return NextResponse.json({ 
      error: user ? `Access Denied: Role is ${user.role}` : "Session expired or missing. Please refresh the page." 
    }, { status: 401 })
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    console.log(`AI Classification Attempt. Key starts with: ${key ? key.substring(0, 4) + "****" : "MISSING"}`);
    const { question, subjects, explanation, courseName } = await request.json()

    if (!question || !subjects || !Array.isArray(subjects)) {
      return NextResponse.json({ error: "question and subjects array are required" }, { status: 400 })
    }

    // 1. Filter out known "header" subjects (e.g. ⬇️⬇️ Obstetrics ⬇️⬇️)
    const filteredSubjects = subjects
      .filter((s: any) => {
        const name = s.subject || s.name || ""
        // Ignore if contains emoji arrows or multiple dashes
        if (/[⬇️⬆️➡️⬅️]/.test(name)) return false
        if (name.includes("---")) return false
        if (name.toLowerCase().includes("unclassified pool")) return false
        return true
      })
      .map((s: any) => ({ id: s.id, name: s.subject || s.name }))

    // 2. Try Gemini AI classification
    const aiResult = await suggestCategoryWithGemini(
      question,
      explanation || "",
      filteredSubjects,
      courseName || "Medical Course"
    )

    if (aiResult && aiResult.lectureId > 0) {
      return NextResponse.json({
        suggested_subject_id: aiResult.lectureId,
        reasoning: aiResult.reasoning,
        confidence: "high",
        method: "gemini"
      })
    }

    // 3. Fallback to Keyword based matching if AI fails or returns 0
    const qText = (question + " " + (explanation || "")).toLowerCase()
    let bestSubject = null
    let maxMatches = 0
    let bestMatchReason = ""

    // Try multi-word matching first
    for (const sub of subjects) {
      const subName = (sub.subject || sub.name || "").toLowerCase().trim()
      if (!subName || subName.includes("---") || subName.includes("pool")) continue
      
      // Exact full name match
      if (qText.includes(subName)) {
        bestSubject = sub
        maxMatches = 100 // High priority for exact name match
        bestMatchReason = `Matched full lecture title: "${subName}"`
        break
      }

      const keywords = subName.split(/\s+/).filter((k: string) => k.length >= 3)
      let matches = 0
      for (const k of keywords) {
        if (qText.includes(k)) matches++
      }

      if (matches > maxMatches) {
        maxMatches = matches
        bestSubject = sub
        bestMatchReason = `Matched ${matches} keywords from "${subName}"`
      }
    }

    return NextResponse.json({ 
      suggested_subject_id: bestSubject?.id || null,
      reasoning: bestMatchReason || "No clear match found",
      confidence: maxMatches === 100 ? "high" : (maxMatches > 1 ? "medium" : (maxMatches > 0 ? "low" : "none")),
      method: "keyword"
    })
  } catch (error: any) {
    console.error("AI Classification failed:", error)
    return NextResponse.json({ 
      error: "AI service currently unavailable", 
      details: error.message 
    }, { status: 500 })
  }
}
