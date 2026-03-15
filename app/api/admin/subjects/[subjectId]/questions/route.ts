import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET all questions for a specific subject (Admin view: ignores active status)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params

    const sql = `
      SELECT 
        q.id, q.question AS question_text, q.explanation AS explanation_html,
        q.subject_id, q.type_id, q.active, q.period_id,
        s.subject AS subject_name,
        qt.type AS question_type,
        qp.period AS exam_period,
        
        -- Aggregate Options
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', o.id, 
            'option', o.option, 
            'correct', o.correct,
            'selection_count', (SELECT COUNT(*) FROM assessments_questions aq WHERE aq.answer_id = o.id)
          ) ORDER BY o.id)
          FROM options o WHERE o.question_id = q.id
        ), '[]'::json) AS options,

        -- Aggregate Figures
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', f.id, 
            'image_url', f.figure, 
            'public_id', f.public_id, 
            'type_id', f.type_id,
            'figure_type', ft.type
          ) ORDER BY f.id)
          FROM figures f
          LEFT JOIN figures_types ft ON f.type_id = ft.id
          WHERE f.question_id = q.id
        ), '[]'::json) AS figures,

        -- Aggregate Sub-questions
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', sq.id, 
            'subquestion_text', sq.question, 
            'answer_html', sq.answer
          ) ORDER BY sq.id)
          FROM sub_questions sq WHERE sq.case_id = q.id
        ), '[]'::json) AS sub_questions

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
    const { question, explanation, active, type_id, period_id, options, figures, sub_questions } = body

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

    const newQuestionId = result.rows[0].id

    if (options && Array.isArray(options)) {
      for (const opt of options) {
        await query(`INSERT INTO options (option, correct, question_id) VALUES ($1, $2, $3)`, [opt.option, opt.correct || false, newQuestionId])
      }
    }
    if (figures && Array.isArray(figures)) {
      for (const fig of figures) {
        await query(`INSERT INTO figures (figure, public_id, question_id, type_id) VALUES ($1, $2, $3, $4)`, [fig.image_url, fig.public_id || '', newQuestionId, fig.figure_type || 1])
      }
    }
    if (sub_questions && Array.isArray(sub_questions)) {
      for (const sq of sub_questions) {
        await query(`INSERT INTO sub_questions (question, answer, case_id) VALUES ($1, $2, $3)`, [sq.subquestion_text, sq.answer_html || '', newQuestionId])
      }
    }

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create question:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}
