import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT
        c.id,
        c.course AS name,
        c.active,
        c.background AS hero_image,
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND (q.status != 'active' OR q.active = false)), 0) AS kitchen_total,
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.status IN ('unclassified', 'flagged')), 0) AS kitchen_unclassified,
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND (q.status = 'draft' OR (q.status = 'active' AND q.active = false))), 0) AS kitchen_classified,
        CASE 
          WHEN (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND (q.status != 'active' OR q.active = false)) > 0 
          THEN ROUND(
            (SELECT COUNT(*)::float FROM questions q WHERE q.course_id = c.id AND (q.status = 'draft' OR (q.status = 'active' AND q.active = false))) / 
            (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND (q.status != 'active' OR q.active = false)) * 100
          )
          ELSE 0 
        END AS kitchen_percentage
      FROM courses c
      ORDER BY c.active ASC, c.course ASC
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Failed to fetch all courses:", error)
    return NextResponse.json([], { status: 500 })
  }
}
