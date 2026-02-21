import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

async function getCourseId(slug: string): Promise<number | null> {
  const r = await query(`SELECT id FROM courses WHERE public_id = $1 OR id::text = $1`, [slug])
  return r.rows.length > 0 ? r.rows[0].id : null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const courseId = await getCourseId(slug)
    if (!courseId) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    const showAll = request.nextUrl.searchParams.get("all") === "true"
    const activeFilter = showAll ? "" : "AND s.active = true"

    const result = await query(`
      SELECT
        s.id,
        s.subject AS name,
        s.course_id,
        s.active,
        (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.id AND q.active = true) AS question_count
      FROM subjects s
      WHERE s.course_id = $1 ${activeFilter}
      ORDER BY s.id ASC
    `, [courseId])

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Failed to fetch subjects:", error)
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const courseId = await getCourseId(slug)
    if (!courseId) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    const { name } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: "Subject name is required" }, { status: 400 })

    const result = await query(
      `INSERT INTO subjects (subject, course_id, active) VALUES ($1, $2, true) RETURNING id, subject AS name, course_id, active`,
      [name.trim(), courseId]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create subject:", error)
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const courseId = await getCourseId(slug)
    if (!courseId) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    const { id, name, active } = await request.json()
    if (!id) return NextResponse.json({ error: "Subject id is required" }, { status: 400 })

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (name !== undefined) { fields.push(`subject = $${idx++}`); values.push(name.trim()) }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active) }

    if (fields.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 })

    values.push(id, courseId)
    await query(
      `UPDATE subjects SET ${fields.join(", ")} WHERE id = $${idx++} AND course_id = $${idx}`,
      values
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update subject:", error)
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const courseId = await getCourseId(slug)
    if (!courseId) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "Subject id is required" }, { status: 400 })

    await query(`DELETE FROM subjects WHERE id = $1 AND course_id = $2`, [id, courseId])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete subject:", error)
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 })
  }
}
