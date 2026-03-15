import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const questionId = parseInt(id)
    const body = await request.json()
    const { question, explanation, active, type_id, period_id, options, figures, sub_questions } = body

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (question !== undefined) { fields.push(`question = $${idx++}`); values.push(question) }
    if (explanation !== undefined) { fields.push(`explanation = $${idx++}`); values.push(explanation) }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active) }
    if (type_id !== undefined) { fields.push(`type_id = $${idx++}`); values.push(type_id) }
    if (period_id !== undefined) { fields.push(`period_id = $${idx++}`); values.push(period_id) }

    if (fields.length > 0) {
      values.push(questionId)
      const result = await query(
        `UPDATE questions SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, question, explanation, active`,
        values
      )
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 })
      }
    }

    // Options Sync
    if (options && Array.isArray(options)) {
      const existingOpts = await query(`SELECT id FROM options WHERE question_id = $1`, [questionId])
      const incomingIds = options.filter((o: any) => o.id).map((o: any) => o.id)
      const toDelete = existingOpts.rows.filter((o: any) => !incomingIds.includes(o.id)).map((o: any) => o.id)
      
      if (toDelete.length > 0) {
        await query(`DELETE FROM options WHERE id = ANY($1::int[])`, [toDelete])
      }
      
      for (const opt of options) {
        if (opt.id) {
          await query(`UPDATE options SET option = $1, correct = $2 WHERE id = $3 AND question_id = $4`, [opt.option, opt.correct || false, opt.id, questionId])
        } else {
          await query(`INSERT INTO options (option, correct, question_id) VALUES ($1, $2, $3)`, [opt.option, opt.correct || false, questionId])
        }
      }
    }

    // Figures Sync
    if (figures && Array.isArray(figures)) {
      const existingFigs = await query(`SELECT id FROM figures WHERE question_id = $1`, [questionId])
      const incomingIds = figures.filter((f: any) => f.id).map((f: any) => f.id)
      const toDelete = existingFigs.rows.filter((f: any) => !incomingIds.includes(f.id)).map((f: any) => f.id)
      
      if (toDelete.length > 0) {
        await query(`DELETE FROM figures WHERE id = ANY($1::int[])`, [toDelete])
      }
      
      for (const fig of figures) {
        if (fig.id) {
          await query(`UPDATE figures SET figure = $1, public_id = $2, type_id = $3 WHERE id = $4 AND question_id = $5`, [fig.image_url, fig.public_id || '', fig.type_id || 1, fig.id, questionId])
        } else {
          await query(`INSERT INTO figures (figure, public_id, question_id, type_id) VALUES ($1, $2, $3, $4)`, [fig.image_url, fig.public_id || '', questionId, fig.type_id || 1])
        }
      }
    }

    // Sub-questions Sync
    if (sub_questions && Array.isArray(sub_questions)) {
      const existingSubs = await query(`SELECT id FROM sub_questions WHERE case_id = $1`, [questionId])
      const incomingIds = sub_questions.filter((sq: any) => sq.id).map((sq: any) => sq.id)
      const toDelete = existingSubs.rows.filter((sq: any) => !incomingIds.includes(sq.id)).map((sq: any) => sq.id)
      
      if (toDelete.length > 0) {
        await query(`DELETE FROM sub_questions WHERE id = ANY($1::int[])`, [toDelete])
      }
      
      for (const sq of sub_questions) {
        if (sq.id) {
          await query(`UPDATE sub_questions SET question = $1, answer = $2 WHERE id = $3 AND case_id = $4`, [sq.subquestion_text, sq.answer_html || '', sq.id, questionId])
        } else {
          await query(`INSERT INTO sub_questions (question, answer, case_id) VALUES ($1, $2, $3)`, [sq.subquestion_text, sq.answer_html || '', questionId])
        }
      }
    }

    return NextResponse.json({ success: true, id: questionId })
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
    
    // Manual cascading deletes (just in case fk hasn't ON DELETE CASCADE)
    await query(`DELETE FROM options WHERE question_id = $1`, [parseInt(id)])
    await query(`DELETE FROM figures WHERE question_id = $1`, [parseInt(id)])
    await query(`DELETE FROM sub_questions WHERE case_id = $1`, [parseInt(id)])
    await query(`DELETE FROM questions WHERE id = $1`, [parseInt(id)])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete question:", error)
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}
