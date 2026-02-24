import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const courseId = searchParams.get("course_id")
    const subjectIds = searchParams.get("subject_ids")
    const limit = searchParams.get("limit") || "20"
    const typeId = searchParams.get("type_id")
    const examPeriod = searchParams.get("exam_period")

    if (!courseId) {
      return NextResponse.json({ error: "course_id is required" }, { status: 400 })
    }

    // Build WHERE clause
    // questions table: id, question, period_id, explanation, subject_id, active, type_id
    // subjects table links questions to courses via subjects.course_id
    let sql = `
      SELECT q.id, q.question AS question_text, q.explanation AS explanation_html,
             q.subject_id, q.type_id, q.active,
             s.subject AS subject_name,
             qt.type AS question_type,
             qp.period AS exam_period
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN questions_types qt ON q.type_id = qt.id
      LEFT JOIN questions_periods qp ON q.period_id = qp.id
      WHERE s.course_id = $1 AND q.active = true
    `
    const params: unknown[] = [parseInt(courseId)]
    let pi = 2

    if (subjectIds) {
      const ids = subjectIds.split(",").map(Number).filter(Boolean)
      if (ids.length > 0) {
        sql += ` AND q.subject_id = ANY($${pi}::int[])`
        params.push(ids)
        pi++
      }
    }

    if (typeId) {
      sql += ` AND q.type_id = $${pi}`
      params.push(parseInt(typeId))
      pi++
    }

    if (examPeriod && (examPeriod === "Mid" || examPeriod === "Final")) {
      sql += ` AND qp.period ILIKE $${pi}`
      params.push(`%${examPeriod}%`)
      pi++
    }

    sql += ` ORDER BY RANDOM() LIMIT $${pi}`
    params.push(parseInt(limit))

    const result = await query(sql, params)

    // For each question, fetch options, figures, and sub_questions
    const questions = await Promise.all(
      result.rows.map(async (q: Record<string, unknown>) => {
        // Options: options(id, option, correct, question_id)
        const opts = await query(
          `SELECT o.id, o.option, o.correct,
                  (SELECT COUNT(*) FROM assessments_questions aq WHERE aq.answer_id = o.id) as selection_count
           FROM options o WHERE o.question_id = $1 ORDER BY o.id`,
          [q.id]
        )

        // Figures: figures(id, question_id, figure, public_id, type_id)
        const figs = await query(
          `SELECT f.id, f.figure AS image_url, f.public_id, ft.type AS figure_type
           FROM figures f
           LEFT JOIN figures_types ft ON f.type_id = ft.id
           WHERE f.question_id = $1 ORDER BY f.id`,
          [q.id]
        )

        // Sub-questions for CBQ/case-based: sub_questions(id, case_id, question, answer)
        const subs = await query(
          `SELECT id, question AS subquestion_text, answer AS answer_html
           FROM sub_questions WHERE case_id = $1 ORDER BY id`,
          [q.id]
        )

        return {
          ...q,
          options: opts.rows,
          figures: figs.rows,
          sub_questions: subs.rows,
        }
      })
    )

    return NextResponse.json(questions)
  } catch (error) {
    console.error("Failed to fetch questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}
