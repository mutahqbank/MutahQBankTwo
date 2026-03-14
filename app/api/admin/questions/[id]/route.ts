import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { question, explanation, active, type_id, period_id } = body

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (question !== undefined) { fields.push(`question = $${idx++}`); values.push(question) }
    if (explanation !== undefined) { fields.push(`explanation = $${idx++}`); values.push(explanation) }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active) }
    if (type_id !== undefined) { fields.push(`type_id = $${idx++}`); values.push(type_id) }
    if (period_id !== undefined) { fields.push(`period_id = $${idx++}`); values.push(period_id) }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(parseInt(id))
    const result = await query(
      `UPDATE questions SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, question, explanation, active`,
      values
    )

    if (result.rows.length === 0) {
       return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, question: result.rows[0] })
  } catch (error) {
    console.error("Failed to update question:", error)
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Note: This relies on CASCADE rules in the DB for related options/figures.
    // If cascade is not setup, you may need to delete related records first.
    // We assume foreign keys constraints on options and figures cover ON DELETE CASCADE.
    
    await query(`DELETE FROM questions WHERE id = $1`, [parseInt(id)])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete question:", error)
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}
