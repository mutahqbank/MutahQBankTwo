import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { question, subjects } = await request.json()

    if (!question || !subjects || !Array.isArray(subjects)) {
      return NextResponse.json({ error: "question and subjects array are required" }, { status: 400 })
    }

    // AI Classification logic (Keyword based for now)
    const qText = question.toLowerCase()
    let bestSubject = null
    let maxMatches = 0

    for (const sub of subjects) {
      const subName = sub.subject.toLowerCase()
      // Split subname into keywords
      const keywords = subName.split(/\s+/).filter((k: string) => k.length > 3)
      
      let matches = 0
      for (const k of keywords) {
        if (qText.includes(k)) matches++
      }

      if (matches > maxMatches) {
        maxMatches = matches
        bestSubject = sub
      }
    }

    // Fallback: If no strong keyword match, try raw include
    if (!bestSubject) {
        for (const sub of subjects) {
            if (qText.includes(sub.subject.toLowerCase())) {
                bestSubject = sub
                break
            }
        }
    }

    return NextResponse.json({ 
        suggested_subject_id: bestSubject?.id || null,
        confidence: maxMatches > 0 ? "medium" : "low" 
    })
  } catch (error) {
    console.error("AI Classification failed:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
