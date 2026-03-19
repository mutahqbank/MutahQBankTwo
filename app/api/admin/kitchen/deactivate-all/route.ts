import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 })
  }

  try {
    const { course_id, period_id } = await request.json()
    if (!course_id) {
       return NextResponse.json({ error: "course_id is required" }, { status: 400 })
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
