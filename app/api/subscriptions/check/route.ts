import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Check if user has an active subscription for a course
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get("user_id")
    const courseId = searchParams.get("course_id")

    if (!userId || !courseId) {
      return NextResponse.json({ subscribed: false })
    }

    const result = await query(`
      SELECT s.id FROM subscriptions s
      JOIN packages p ON s.package_id = p.id
      JOIN plans pl ON p.id = pl.package_id
      WHERE s.user_id = $1 AND pl.course_id = $2 AND s.active = true
      LIMIT 1
    `, [parseInt(userId), parseInt(courseId)])

    return NextResponse.json({ subscribed: result.rows.length > 0 })
  } catch (error) {
    console.error("Subscription check failed:", error)
    return NextResponse.json({ subscribed: false })
  }
}
