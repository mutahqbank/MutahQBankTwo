import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  
  // Strict check: Admins only for bulk activation
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 })
  }

  try {
    const { course_id } = await request.json()
    if (!course_id) {
       return NextResponse.json({ error: "course_id is required" }, { status: 400 })
    }

    // Find the "Unclassified Pool" subject ID for this course
    const poolRes = await query(
      "SELECT id FROM subjects WHERE course_id = $1 AND subject = 'Unclassified Pool' LIMIT 1",
      [course_id]
    )
    const poolId = poolRes.rows[0]?.id

    // Identify the questions that will be activated:
    // Any question that is not 'active' and not 'flagged' AND is not in the pool
    let sql = `
      SELECT id FROM questions 
      WHERE course_id = $1 
      AND status != 'active' 
      AND status != 'flagged'
    `
    const params = [course_id]
    if (poolId) {
      sql += ` AND subject_id != $2`
      params.push(poolId)
    }

    const targetRes = await query(sql, params)

    if (targetRes.rows.length === 0) {
      return NextResponse.json({ 
        success: true, 
        count: 0,
        message: "No classified questions found to activate." 
      })
    }

    // Perform bulk update
    let updateSql = `
      UPDATE questions 
      SET status = 'active', active = true
      WHERE course_id = $1 
      AND status != 'active' 
      AND status != 'flagged'
    `
    if (poolId) {
      updateSql += ` AND subject_id != $2`
    }

    await query(updateSql, params)

    return NextResponse.json({ 
      success: true, 
      count: targetRes.rows.length,
      message: `Successfully activated ${targetRes.rows.length} questions.`
    })
  } catch (error: any) {
    console.error("Bulk activation failed:", error)
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 })
  }
}
