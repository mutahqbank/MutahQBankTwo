import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT
        c.id,
        c.course AS name,
        (SELECT COUNT(*) FROM questions q
          JOIN subjects s ON q.subject_id = s.id
          WHERE s.course_id = c.id AND q.active = true) AS questions_count
      FROM courses c
      ORDER BY c.course ASC
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Failed to fetch all courses:", error)
    return NextResponse.json([], { status: 500 })
  }
}
