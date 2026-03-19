import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const courseId = searchParams.get("course_id")
  const status = searchParams.get("status")
  const periodId = searchParams.get("period_id")

  if (!courseId) {
    return NextResponse.json({ error: "course_id is required" }, { status: 400 })
  }

  // Security Check
  const courseResult = await query("SELECT course FROM courses WHERE id = $1", [courseId])
  if (courseResult.rows.length === 0) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }
  const courseName = courseResult.rows[0].course

  if (user.role === "instructor") {
    const allowed = (user.allowed_courses || []).map((c: string) => c.toLowerCase())
    if (!allowed.includes(courseName.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  try {
    let sql = `
      SELECT q.*, 
             s.subject as subject_name,
             (
               SELECT json_agg(o.* ORDER BY o.id)
               FROM options o
               WHERE o.question_id = q.id
             ) as raw_options
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE q.course_id = $1
    `
    const params: any[] = [courseId]

    if (status) {
      const statusArr = status.split(',')
      sql += ` AND q.status = ANY($2)`
      params.push(statusArr)
    } else {
      sql += ` AND (q.status != 'active' OR q.active = false)`
    }

    if (periodId) {
      sql += ` AND q.period_id = $${params.length + 1}`
      params.push(parseInt(periodId))
    }

    sql += ` ORDER BY q.id DESC`

    const result = await query(sql, params)
    
    // Format options for frontend
    const formattedRows = result.rows.map(q => {
      const options = (q.raw_options || []).map((o: any) => o.option)
      const correctIdx = (q.raw_options || []).findIndex((o: any) => o.correct === true)
      
      return {
        ...q,
        options,
        correct_index: correctIdx >= 0 ? correctIdx : 0
      }
    })

    return NextResponse.json(formattedRows)
  } catch (error) {
    console.error("Failed to fetch kitchen questions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { course_id, questions } = await request.json()

    if (!course_id || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "course_id and questions array are required" }, { status: 400 })
    }

    // Security Check
    const courseResult = await query("SELECT course FROM courses WHERE id = $1", [course_id])
    if (courseResult.rows.length === 0) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    if (user.role === "instructor") {
      const allowed = (user.allowed_courses || []).map((c: string) => c.toLowerCase())
      if (!allowed.includes(courseResult.rows[0].course.toLowerCase())) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Find a default period_id to satisfy NOT NULL constraint
    const periodsRes = await query("SELECT id FROM questions_periods LIMIT 1")
    const defaultPeriodId = periodsRes.rows[0]?.id || 1

    // Find or create a dedicated "Unclassified Pool" subject for staging
    let defaultSubjectId: number
    const subjectsRes = await query(
      "SELECT id FROM subjects WHERE course_id = $1 AND subject = $2 LIMIT 1", 
      [course_id, "Unclassified Pool"]
    )
    
    if (subjectsRes.rows.length > 0) {
      defaultSubjectId = subjectsRes.rows[0].id
    } else {
      // Create it if it doesn't exist
      const newSubjectRes = await query(
        "INSERT INTO subjects (course_id, subject, active) VALUES ($1, $2, true) RETURNING id",
        [course_id, "Unclassified Pool"]
      )
      defaultSubjectId = newSubjectRes.rows[0].id
    }

    if (!defaultSubjectId) {
       throw new Error("Failed to resolve or create a default subject_id for the Kitchen pool")
    }

    const insertedIds = []
    for (const q of questions) {
      // Minimal insert for unclassified
      const result = await query(`
        INSERT INTO questions (
          course_id, question, explanation, status, active, type_id, period_id, subject_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        course_id, 
        q.question || "", 
        q.explanation || "", 
        "unclassified", 
        false, // Not active until approved
        q.type_id || 1,
        q.period_id || defaultPeriodId,
        defaultSubjectId
      ])
      
      const questionId = result.rows[0].id
      insertedIds.push(questionId)

      // Handle Options if present
      if (q.options && Array.isArray(q.options)) {
        for (const opt of q.options) {
          await query(`
            INSERT INTO options (question_id, option, correct)
            VALUES ($1, $2, $3)
          `, [questionId, opt.option, opt.correct || false])
        }
      }
    }

    return NextResponse.json({ success: true, count: insertedIds.length })
  } catch (error: any) {
    console.error("Failed to import questions to kitchen:", error)
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
