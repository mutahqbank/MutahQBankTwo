import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        const { searchParams } = request.nextUrl
        const userId = searchParams.get("user_id")
        const sessionId = parseInt(id)

        if (!userId || isNaN(sessionId)) {
            return NextResponse.json({ error: "user_id and valid session id are required" }, { status: 400 })
        }

        // Find the past session for this user
        const result = await query(
            `SELECT a.id, a.type_id, a.current_position, a.date, a.status
       FROM assessments a
       WHERE a.id = $1 AND a.user_id = $2`,
            [sessionId, parseInt(userId)]
        )

        if (result.rows.length === 0) {
            return NextResponse.json(null) // Not found or unauthorized
        }

        const session = result.rows[0]

        // Fetch the stored questions and user's answers
        const questionsRes = await query(
            `SELECT aq.question_id, aq.position, aq.answer_id, aq.flagged, aq.note
       FROM assessments_questions aq
       WHERE aq.assessment_id = $1
       ORDER BY aq.position ASC`,
            [session.id]
        )

        const questionIds = questionsRes.rows.map((r: any) => r.question_id)

        if (questionIds.length === 0) {
            return NextResponse.json(null)
        }

        const qBodyRes = await query(`
      SELECT 
        q.id, q.question AS question_text, q.explanation AS explanation_html,
        s.id AS subject_id, s.subject AS subject_name,
        qt.type AS question_type, qp.period AS exam_period,
        (SELECT json_agg(json_build_object('id', o.id, 'option', o.option, 'correct', o.correct, 'selection_count', (SELECT COUNT(*) FROM assessments_questions aq WHERE aq.answer_id = o.id))) FROM options o WHERE o.question_id = q.id) AS options,
        COALESCE((SELECT json_agg(json_build_object('id', f.id, 'image_url', f.figure, 'figure_type', ft.type)) FROM figures f LEFT JOIN figures_types ft ON f.type_id = ft.id WHERE f.question_id = q.id), '[]'::json) AS figures,
        COALESCE((SELECT json_agg(json_build_object('id', sq.id, 'subquestion_text', sq.question, 'answer_html', sq.answer)) FROM sub_questions sq WHERE sq.case_id = q.id), '[]'::json) AS sub_questions
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN questions_types qt ON q.type_id = qt.id
      LEFT JOIN questions_periods qp ON q.period_id = qp.id
      WHERE q.id = ANY($1::int[])
    `, [questionIds])

        // Organize and hydrate
        const hydratedQuestions = questionsRes.rows.map((sessionRow: any) => {
            const qBody = qBodyRes.rows.find((row: any) => row.id === sessionRow.question_id)
            let parsedNotes = {}
            if (sessionRow.note) {
                try {
                   parsedNotes = JSON.parse(sessionRow.note)
                } catch(e) {}
            }
            return {
                ...qBody,
                _savedAnswerId: sessionRow.answer_id,
                _savedFlagged: sessionRow.flagged,
                _savedNotes: parsedNotes
            }
        })

        return NextResponse.json({
            assessment_id: session.id,
            type_id: session.type_id,
            current_position: session.current_position,
            status: session.status,
            questions: hydratedQuestions
        })

    } catch (error) {
        console.error("Failed to fetch session:", error)
        return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
    }
}
