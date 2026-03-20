import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  const isAdmin = user?.role === "admin"
  const isInstructor = user?.role === "instructor"
  
  if (!user || (!isAdmin && !isInstructor)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { course_id, period_id } = await request.json()
    if (!course_id) {
       return NextResponse.json({ error: "course_id is required" }, { status: 400 })
    }

    // Security check for instructors
    if (isInstructor && !isAdmin) {
      const courseRes = await query("SELECT course FROM courses WHERE id = $1", [course_id])
      if (courseRes.rows.length === 0) return NextResponse.json({ error: "Course not found" }, { status: 404 })
      const courseName = courseRes.rows[0].course
      const allowed = (user.allowed_courses || []).map((c: string) => c.toLowerCase())
      if (!allowed.includes(courseName.toLowerCase())) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    let sql = `
      UPDATE questions 
      SET status = 'draft', 
          active = false
      WHERE course_id = $1 
      AND active = true
    `
    const params = [course_id]
    if (period_id) {
      sql += ` AND period_id = $2`
      params.push(period_id)
    }
    
    const result = await query(sql, params)

    return NextResponse.json({ 
      success: true, 
      count: result.rowCount,
      message: `Successfully moved ${result.rowCount} questions back to the kitchen.`
    })
  } catch (error: any) {
    console.error("Bulk deactivation failed:", error)
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 })
  }
}
