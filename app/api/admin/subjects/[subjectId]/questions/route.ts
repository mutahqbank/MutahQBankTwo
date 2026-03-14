import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET all questions for a specific subject (Admin view: ignores active status)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params
    
    // Check admin status (in a real app, middleware would do this, but adding basic check here if needed)
    // We assume the route is protected by standard admin practices or middleware

    const sql = `
      SELECT 
        q.id, q.question AS question_text, q.explanation AS explanation_html,
        q.subject_id, q.type_id, q.active, q.period_id,
        s.subject AS subject_name,
        qt.type AS question_type,
        qp.period AS exam_period
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN questions_types qt ON q.type_id = qt.id
      LEFT JOIN questions_periods qp ON q.period_id = qp.id
      WHERE q.subject_id = $1
      ORDER BY q.id ASC
    `
    const result = await query(sql, [parseInt(subjectId)])

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Failed to fetch subject questions:", error)
    return NextResponse.json({ error: "Failed to fetch subject questions" }, { status: 500 })
  }
}

// POST: Add a new question to this subject
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params
    const body = await request.json()
    const { question, explanation, active, type_id, period_id } = body

    if (!question) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO questions (question, explanation, subject_id, type_id, active, period_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, question, explanation, type_id, active, period_id`,
      [
        question, 
        explanation || "", 
        parseInt(subjectId), 
        type_id ? parseInt(type_id) : 1, // Default to MCQ (1)
        active !== undefined ? active : true,
        period_id ? parseInt(period_id) : null
      ]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create question:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}
