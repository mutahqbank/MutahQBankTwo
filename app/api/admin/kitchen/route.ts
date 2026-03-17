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
             s.subject as subject_name
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE q.course_id = $1
    `
    const params: any[] = [courseId]

    if (status) {
      sql += ` AND q.status = $2`
      params.push(status)
    } else {
      // By default, exclude approved/active ones from the Kitchen view
      // unless we are in the "All Questions" section
      sql += ` AND q.status != 'active'`
    }

    sql += ` ORDER BY q.id DESC`

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
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

    const insertedIds = []
    for (const q of questions) {
      // Minimal insert for unclassified
      const result = await query(`
        INSERT INTO questions (
          course_id, question, explanation, status, creator_id, active, type_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        course_id, 
        q.question || "", 
        q.explanation || "", 
        "unclassified", 
        user.id, 
        false, // Not active until approved
        q.type_id || 1
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
  } catch (error) {
    console.error("Failed to import questions to kitchen:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
