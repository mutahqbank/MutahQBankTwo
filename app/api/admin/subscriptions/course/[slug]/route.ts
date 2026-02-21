import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        // 1) Find all active subscriptions matching this course
        // Exclude protected users 164, 500, 509
        const subsRes = await query(`
      SELECT s.id
      FROM subscriptions s
      JOIN plans pl ON s.package_id = pl.package_id
      JOIN courses c ON c.id = pl.course_id
      WHERE (c.public_id = $1 OR c.id::text = $1)
        AND s.active = true
        AND s.user_id NOT IN (164, 500, 509)
    `, [slug])

        if (subsRes.rows.length === 0) {
            return NextResponse.json({ message: "No active subscriptions found to deactivate." }, { status: 200 })
        }

        const ids = subsRes.rows.map((row: any) => row.id)
        const BATCH_SIZE = 500
        let deactivatedCount = 0

        // 2) Batch process updates to prevent query timeouts
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
            const batchIds = ids.slice(i, i + BATCH_SIZE)
            const updateRes = await query(`
        UPDATE subscriptions
        SET active = false
        WHERE id = ANY($1::int[])
      `, [batchIds])

            deactivatedCount += updateRes.rowCount || 0
        }

        return NextResponse.json({
            success: true,
            message: `Successfully deactivated ${deactivatedCount} subscription(s).`
        }, { status: 200 })

    } catch (error) {
        console.error("Failed to deactivate bulk subscriptions:", error)
        return NextResponse.json({ error: "Failed to deactivate subscriptions." }, { status: 500 })
    }
}
