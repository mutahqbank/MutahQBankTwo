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
        
        -- Overall Kitchen
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND (q.active = false OR q.status != 'active')), 0) AS kitchen_total,
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.status IN ('unclassified', 'flagged')), 0) AS kitchen_unclassified,
        
        -- Mid (Period 1)
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.period_id = 1 AND (q.active = false OR q.status != 'active')), 0) AS mid_total,
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.period_id = 1 AND q.status IN ('unclassified', 'flagged')), 0) AS mid_unclassified,
        
        -- Final (Period 2)
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.period_id = 2 AND (q.active = false OR q.status != 'active')), 0) AS final_total,
        COALESCE((SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id AND q.period_id = 2 AND q.status IN ('unclassified', 'flagged')), 0) AS final_unclassified,
        
        -- Lectures (Subjects)
        COALESCE((SELECT COUNT(*) FROM subjects s WHERE s.course_id = c.id), 0) AS subjects_count,

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
