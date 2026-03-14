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

    let sql = `
      SELECT 
        q.id, q.question AS question_text, q.explanation AS explanation_html,
        q.subject_id, q.type_id, q.active,
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

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Failed to fetch questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}