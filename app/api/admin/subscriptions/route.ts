import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    const sql = `
      SELECT
        s.id,
        a.username,
        c.course AS course_name,
        s.date,
        s.duration,
        s.active
      FROM subscriptions s
      JOIN accounts a ON a.user_id = s.user_id
      JOIN packages p ON s.package_id = p.id
      JOIN plans pl ON p.id = pl.package_id
      JOIN courses c ON pl.course_id = c.id
      ORDER BY s.date DESC
      LIMIT $1 OFFSET $2
    `
    const result = await query(sql, [limit, offset])

    const countResult = await query(`SELECT COUNT(*) FROM subscriptions`)

    return NextResponse.json({
      subscriptions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    })
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}

// Toggle subscription active status
export async function PATCH(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id, active } = await request.json()

    const result = await query(
      `UPDATE subscriptions SET active = $1 WHERE id = $2 RETURNING *`,
      [active, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Failed to update subscription:", error)
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
  }
}
