import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    const result = await query(`
      SELECT
        s.id,
        s.user_id,
        s.package_id,
        s.transaction_id,
        s.date,
        s.duration,
        s.active,
        c.id AS course_id,
        c.course AS course_name,
        c.background AS hero_image,
        p.price,
        p.users_limit,
        (s.date + (s.duration || ' days')::interval) AS expires_at
      FROM subscriptions s
      JOIN packages p ON s.package_id = p.id
      JOIN plans pl ON p.id = pl.package_id
      JOIN courses c ON pl.course_id = c.id
      WHERE s.user_id = $1
      ORDER BY s.active DESC, s.date DESC
    `, [parseInt(userId)])

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}
