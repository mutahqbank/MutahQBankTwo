import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { 
      status, 
      subject_id, 
      question, 
      explanation,
      active,
      type_id
    } = body

    // 1. Fetch current question to check ownership/permissions
    const currentQ = await query("SELECT course_id FROM questions WHERE id = $1", [id])
    if (currentQ.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    
    const courseId = currentQ.rows[0].course_id
    const courseResult = await query("SELECT course FROM courses WHERE id = $1", [courseId])
    if (user.role === "instructor" && !(user.allowed_courses || []).includes(courseResult.rows[0].course)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Build Update SQL
    const updates: string[] = []
    const values: any[] = []
    let i = 1

    if (status !== undefined) {
      updates.push(`status = $${i++}`)
      values.push(status)
    }
    if (subject_id !== undefined) {
      updates.push(`subject_id = $${i++}`)
      values.push(subject_id)
    }
    if (question !== undefined) {
      updates.push(`question = $${i++}`)
      values.push(question)
    }
    if (explanation !== undefined) {
      updates.push(`explanation = $${i++}`)
      values.push(explanation)
    }
    if (active !== undefined) {
      updates.push(`active = $${i++}`)
      values.push(active)
    }
    if (type_id !== undefined) {
      updates.push(`type_id = $${i++}`)
      values.push(type_id)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
    }

    values.push(id)
    await query(`
      UPDATE questions 
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${i}
    `, values)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update kitchen question:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const currentQ = await query("SELECT course_id FROM questions WHERE id = $1", [id])
    if (currentQ.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    
    const courseId = currentQ.rows[0].course_id
    const courseResult = await query("SELECT course FROM courses WHERE id = $1", [courseId])
    if (user.role === "instructor" && !(user.allowed_courses || []).includes(courseResult.rows[0].course)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await query("DELETE FROM questions WHERE id = $1", [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete kitchen question:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
