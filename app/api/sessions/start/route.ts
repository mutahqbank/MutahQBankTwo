import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
    try {
        const { user_id, course_id, limit, subject_ids, mode, exam_period } = await request.json()

        if (!user_id || !course_id || !limit) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
        }

        // 1. Mark any old dangling sessions as auto-abandoned to prevent duplicates
        await query(
            `UPDATE assessments SET status = 'abandoned' WHERE user_id = $1 AND course_id = $2 AND status = 'active'`,
            [user_id, course_id]
        )

        // 2. Map mode to type_id (1=study|session, 2=exam)
        const typeId = mode === "exam" ? 2 : 1

        // 3. Create active session in assessments
        const sessionRes = await query(
            `INSERT INTO assessments (user_id, course_id, type_id, date, status, current_position)
       VALUES ($1, $2, $3, NOW(), 'active', 0)
       RETURNING id`,
            [user_id, course_id, typeId]
        )
        const assessmentId = sessionRes.rows[0].id

        // 4. Record subjects if selected
        if (subject_ids && subject_ids.length > 0) {
            const values = (subject_ids as number[]).map((_, i) => `($1, $${i + 2})`).join(", ")
            await query(`INSERT INTO assessments_subjects (assessment_id, subject_id) VALUES ${values}`, [assessmentId, ...subject_ids])
        }

        // 5. Query questions logically
        let qsql = `
      SELECT q.id, q.question AS question_text, q.explanation AS explanation_html,
             s.id AS subject_id, s.subject AS subject_name, qt.type AS question_type, qp.period AS exam_period,
             (SELECT json_agg(json_build_object('id', o.id, 'option', o.option, 'correct', o.correct, 'selection_count', (SELECT COUNT(*) FROM assessments_questions aq WHERE aq.answer_id = o.id))) FROM options o WHERE o.question_id = q.id) AS options,
             COALESCE((SELECT json_agg(json_build_object('id', f.id, 'image_url', f.figure, 'figure_type', ft.type)) FROM figures f LEFT JOIN figures_types ft ON f.type_id = ft.id WHERE f.question_id = q.id), '[]'::json) AS figures,
             COALESCE((SELECT json_agg(json_build_object('id', sq.id, 'subquestion_text', sq.question, 'answer_html', sq.answer)) FROM sub_questions sq WHERE sq.case_id = q.id), '[]'::json) AS sub_questions
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN questions_types qt ON q.type_id = qt.id
      LEFT JOIN questions_periods qp ON q.period_id = qp.id
      WHERE s.course_id = $1 AND q.active = true
    `
        const qparams: unknown[] = [parseInt(course_id)]

        if (subject_ids && subject_ids.length > 0) {
            qsql += ` AND q.subject_id = ANY($2::int[])`
            qparams.push(subject_ids)
        }

        if (exam_period && (exam_period === "Mid" || exam_period === "Final")) {
            qsql += ` AND qp.period ILIKE $${qparams.length + 1}`
            qparams.push(`%${exam_period}%`)
        }

        qsql += ` ORDER BY RANDOM() LIMIT $${qparams.length + 1}`
        qparams.push(parseInt(limit))

        const questionsRes = await query(qsql, qparams)
        const questions = questionsRes.rows

        if (questions.length === 0) {
            // Cleanup abandoned session
            await query(`DELETE FROM assessments WHERE id = $1`, [assessmentId])
            return NextResponse.json({ error: "No questions found for selection" }, { status: 404 })
        }

        // 6. Bulk Insert the generated questions into assessments_questions to persist the queue
        const aqValues: string[] = []
        const aqParams: unknown[] = [assessmentId]

        questions.forEach((q: any, idx: number) => {
            const pIdx = aqParams.length + 1
            aqValues.push(`($1, $${pIdx}, $${pIdx + 1}, null, false)`)
            aqParams.push(q.id, idx + 1) // position is 1-indexed
        })

        await query(
            `INSERT INTO assessments_questions (assessment_id, question_id, position, answer_id, flagged) 
       VALUES ${aqValues.join(", ")}`,
            aqParams
        )

        // Return the bundle
        return NextResponse.json({
            assessment_id: assessmentId,
            type_id: typeId,
            current_position: 0,
            questions: questions
        })

    } catch (error) {
        console.error("Failed to start session:", error)
        return NextResponse.json({ error: "Failed to start session" }, { status: 500 })
    }
}
