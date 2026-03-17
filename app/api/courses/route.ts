import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const revalidate = 60

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
          WHERE s.course_id = c.id AND q.active = true AND s.active = true) AS total_questions,
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
export async function POST(request: NextRequest) {
  try {
    const { name, background } = await request.json()
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    const public_id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7)
    
    const result = await query(
      "INSERT INTO courses (course, public_id, active, background) VALUES ($1, $2, false, $3) RETURNING id, course AS name",
      [name, public_id, background || "/images/courses/default.jpg"]
    )
    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("Failed to create course:", error)
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message,
      code: error.code 
    }, { status: 500 })
  }
}
