import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const result = await query(`
      SELECT
        c.id,
        c.course AS name,
        c.description,
        c.about,
        c.active AS is_active,
        c.background AS hero_image,
        c.id AS slug,
        (SELECT COUNT(*) FROM subjects s WHERE s.course_id = c.id AND s.active = true) AS total_subjects,
        (SELECT COUNT(*) FROM questions q
          JOIN subjects s ON q.subject_id = s.id
          WHERE s.course_id = c.id AND q.active = true) AS total_questions
      FROM courses c
      WHERE c.public_id = $1 OR c.id::text = $1
    `, [slug])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Failed to fetch course:", error)
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    const courseResult = await query(
      `SELECT id FROM courses WHERE public_id = $1 OR id::text = $1`,
      [slug]
    )
    if (courseResult.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    const courseId = courseResult.rows[0].id

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (body.name !== undefined) { fields.push(`course = $${idx++}`); values.push(body.name) }
    if (body.description !== undefined) { fields.push(`description = $${idx++}`); values.push(body.description) }
    if (body.about !== undefined) { fields.push(`about = $${idx++}`); values.push(body.about) }
    if (body.is_active !== undefined) { fields.push(`active = $${idx++}`); values.push(body.is_active) }
    if (body.hero_image !== undefined) { fields.push(`background = $${idx++}`); values.push(body.hero_image) }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(courseId)
    await query(`UPDATE courses SET ${fields.join(", ")} WHERE id = $${idx}`, values)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update course:", error)
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}
