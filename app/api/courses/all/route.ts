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
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.status != 'active'), 0) AS kitchen_total,
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.status = 'unclassified'), 0) AS kitchen_unclassified,
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.status = 'draft'), 0) AS kitchen_classified,
        CASE 
          WHEN (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.status != 'active') > 0 
          THEN ROUND((SELECT COUNT(*)::float FROM questions q WHERE q.course_id = c.id AND q.status = 'draft') / (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.status != 'active') * 100)
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
