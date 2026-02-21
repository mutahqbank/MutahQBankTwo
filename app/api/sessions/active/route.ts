import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const userId = searchParams.get("user_id")
        const courseId = searchParams.get("course_id")

        if (!userId || !courseId) {
            return NextResponse.json({ error: "user_id and course_id are required" }, { status: 400 })
        }

        // Find an active session for this user + course
        const result = await query(
            `SELECT a.id, a.type_id, a.current_position, a.date
       FROM assessments a
       WHERE a.user_id = $1 AND a.course_id = $2 AND a.status = 'active'
       ORDER BY a.date DESC LIMIT 1`,
            [parseInt(userId), parseInt(courseId)]
        )

        if (result.rows.length === 0) {
            return NextResponse.json(null) // No active session
        }

        const session = result.rows[0]

        // Fetch the stored questions and user's answers for this exact session
        const questionsRes = await query(
            `SELECT aq.question_id, aq.position, aq.answer_id, aq.flagged
       FROM assessments_questions aq
       WHERE aq.assessment_id = $1
       ORDER BY aq.position ASC`,
            [session.id]
        )

        // Reconstruct the full question data array by querying the questions table
        const questionIds = questionsRes.rows.map((r: any) => r.question_id)

        if (questionIds.length === 0) {
            // Edge case: Corrupted active session with 0 questions
            return NextResponse.json(null)
        }

        // Fetch deep question bodies (re-using the logic from /api/questions, but pinned to these IDs)
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

        // Map the database rows to the exact shape expected by the frontend, preserving order and injecting the saved session state
        const hydratedQuestions = questionsRes.rows.map((sessionRow: any) => {
            const qBody = qBodyRes.rows.find((row: any) => row.id === sessionRow.question_id)
            return {
                ...qBody,
                // Session persisted state
                _savedAnswerId: sessionRow.answer_id,
                _savedFlagged: sessionRow.flagged
            }
        })

        return NextResponse.json({
            assessment_id: session.id,
            type_id: session.type_id,
            current_position: session.current_position,
            questions: hydratedQuestions
        })

    } catch (error) {
        console.error("Failed to fetch active session:", error)
        return NextResponse.json({ error: "Failed to fetch active session" }, { status: 500 })
    }
}
