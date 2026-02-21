import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Create a new assessment (session) and record selected subjects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, course_id, type_id, subject_ids } = body

    // type_id comes from assessments_types (e.g., 1=study, 2=exam, 3=session)
    const result = await query(
      `INSERT INTO assessments (user_id, course_id, type_id, date)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [user_id, course_id, type_id || 1]
    )
    const assessment = result.rows[0] as { id: number }

    // Record selected subjects
    if (subject_ids && subject_ids.length > 0) {
      const values = (subject_ids as number[])
        .map((_: number, i: number) => `($1, $${i + 2})`)
        .join(", ")
      const subParams = [assessment.id, ...subject_ids]
      await query(
        `INSERT INTO assessments_subjects (assessment_id, subject_id) VALUES ${values}`,
        subParams
      )
    }

    return NextResponse.json(assessment, { status: 201 })
  } catch (error) {
    console.error("Failed to create assessment:", error)
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 })
  }
}

// Submit exam answers in one batch
export async function PUT(request: NextRequest) {
  try {
    const { assessment_id, answers } = await request.json()
    // answers: Array<{ position, question_id, answer_id, flagged, note }>

    if (!assessment_id || !answers?.length) {
      return NextResponse.json({ error: "assessment_id and answers are required" }, { status: 400 })
    }

    // Security check: If assessment is an exam (type_id=2), reject case-based answers (type_id=2)
    const typeRes = await query(`SELECT type_id FROM assessments WHERE id = $1`, [assessment_id])
    if (typeRes.rows.length > 0 && typeRes.rows[0].type_id === 2) {
      const qIds = answers.map((a: any) => a.question_id).filter(Boolean)
      if (qIds.length > 0) {
        const cbqCheck = await query(`SELECT id FROM questions WHERE type_id = 2 AND id = ANY($1::int[]) LIMIT 1`, [qIds])
        if (cbqCheck.rows.length > 0) {
          return NextResponse.json({ error: "Case-based questions are not allowed in Exam submissions" }, { status: 403 })
        }
      }
    }

    // Upsert all answers
    for (const a of answers as { position: number; question_id: number; answer_id: number | null; flagged: boolean; note: string | null }[]) {
      await query(
        `INSERT INTO assessments_questions (assessment_id, question_id, position, answer_id, flagged, note)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (assessment_id, question_id)
         DO UPDATE SET answer_id = $4, flagged = $5, note = $6`,
        [assessment_id, a.question_id, a.position, a.answer_id, a.flagged ?? false, a.note]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to submit answers:", error)
    return NextResponse.json({ error: "Failed to submit answers" }, { status: 500 })
  }
}

// Get user assessments for a course
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get("user_id")
    const courseId = searchParams.get("course_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    let sql = `
      SELECT a.id, a.course_id, a.type_id, a.date, a.status,
             at.type AS assessment_type,
             c.course AS course_name,
             (SELECT COUNT(*) FROM assessments_questions aq WHERE aq.assessment_id = a.id) AS total_questions,
             (SELECT COUNT(*) FROM assessments_questions aq
              JOIN options o ON aq.answer_id = o.id
              WHERE aq.assessment_id = a.id AND o.correct = true) AS correct_answers
      FROM assessments a
      JOIN assessments_types at ON a.type_id = at.id
      JOIN courses c ON a.course_id = c.id
      WHERE a.user_id = $1
    `
    const params: unknown[] = [parseInt(userId)]

    if (courseId) {
      sql += ` AND a.course_id = $2`
      params.push(parseInt(courseId))
    }

    sql += ` ORDER BY a.date DESC LIMIT 50`
    const result = await query(sql, params)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Failed to fetch assessments:", error)
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 })
  }
}
