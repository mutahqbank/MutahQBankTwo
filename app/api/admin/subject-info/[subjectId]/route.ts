import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params
    const user = await getServerUser()
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query(`
      SELECT s.subject as subject_name, c.course as course_name 
      FROM subjects s 
      JOIN courses c ON s.course_id = c.id 
      WHERE s.id = $1
    `, [parseInt(subjectId)])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Failed to fetch subject info:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
