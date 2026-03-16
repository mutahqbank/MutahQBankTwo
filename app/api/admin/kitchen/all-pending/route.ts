import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await query(`
      SELECT q.*, 
             s.subject as subject_name,
             c.course as course_name
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE q.status = 'pending_approval'
      ORDER BY q.updated_at DESC
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Failed to fetch all-pending questions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
