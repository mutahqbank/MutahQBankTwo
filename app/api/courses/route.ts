import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT
        c.id,
        c.course AS name,
        c.description,
        c.about,
        c.active AS is_active,
        c.background AS hero_image,
        c.id AS slug,
        (SELECT COUNT(*) FROM subjects s WHERE s.course_id = c.id AND s.active = true) AS total_subjects,
        (SELECT COUNT(*) FROM questions q
          JOIN subjects s ON q.subject_id = s.id
          WHERE s.course_id = c.id AND q.active = true) AS total_questions,
        (SELECT COUNT(*) FROM subscriptions sub
          JOIN plans p ON sub.package_id = p.package_id
          WHERE p.course_id = c.id AND sub.active = true) AS current_subscriptions
      FROM courses c
      WHERE c.active = true
      ORDER BY c.id ASC
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Failed to fetch courses:", error)
    return NextResponse.json([], { status: 500 })
  }
}
