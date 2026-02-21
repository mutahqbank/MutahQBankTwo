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
        f.id,
        a.username,
        q.question AS question_text,
        ft.type AS feed_type,
        f.content,
        f.date,
        f.question_id,
        f.user_id
      FROM feeds f
      JOIN accounts a ON a.user_id = f.user_id
      LEFT JOIN feeds_types ft ON f.type_id = ft.id
      LEFT JOIN questions q ON f.question_id = q.id
      ORDER BY f.date DESC
      LIMIT $1 OFFSET $2
    `
    const result = await query(sql, [limit, offset])

    const countResult = await query(`SELECT COUNT(*) FROM feeds`)

    return NextResponse.json({
      feeds: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    })
  } catch (error) {
    console.error("Failed to fetch feeds:", error)
    return NextResponse.json({ error: "Failed to fetch feeds" }, { status: 500 })
  }
}
