import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { current_position, question_id, answer_id, flagged, action } = await request.json()

        // 1. If action is 'abandon' or 'complete', update status and exit
        if (action === "abandon") {
            await query(`UPDATE assessments SET status = 'abandoned' WHERE id = $1`, [parseInt(id)])
            return NextResponse.json({ success: true, status: "abandoned" })
        }
        if (action === "complete") {
            await query(`UPDATE assessments SET status = 'completed' WHERE id = $1`, [parseInt(id)])
            return NextResponse.json({ success: true, status: "completed" })
        }

        // 2. Otherwise it's a lightweight sync ping.
        // Update the pointer
        if (current_position !== undefined) {
            await query(`UPDATE assessments SET current_position = $1 WHERE id = $2`, [current_position, parseInt(id)])
        }

        // Update specific question answer / flagged state
        if (question_id !== undefined) {
            let sql = `UPDATE assessments_questions SET `
            const queryParams: unknown[] = []

            if (answer_id !== undefined) {
                queryParams.push(answer_id)
                sql += `answer_id = $${queryParams.length}`
            }
            if (flagged !== undefined) {
                if (queryParams.length > 0) sql += `, `
                queryParams.push(flagged)
                sql += `flagged = $${queryParams.length}`
            }

            if (queryParams.length > 0) {
                queryParams.push(parseInt(id), question_id)
                sql += ` WHERE assessment_id = $${queryParams.length - 1} AND question_id = $${queryParams.length}`
                await query(sql, queryParams)
            }
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Failed to sync session progress:", error)
        return NextResponse.json({ error: "Failed to sync session progress" }, { status: 500 })
    }
}
