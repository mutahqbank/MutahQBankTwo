import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

// GET - Get specific instructor details
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const result = await query(`
      SELECT
        u.id, u.first_name, u.last_name, u.phone, u.email,
        a.username, a.active,
        r.role,
        du.allowed_courses
      FROM users u
      JOIN accounts a ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      LEFT JOIN dashboard_users du ON a.username = du.username
      WHERE u.id = $1 AND r.role = 'instructor'
    `, [parseInt(id)])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 })
    }

    const instructor = result.rows[0]
    instructor.allowed_courses = typeof instructor.allowed_courses === 'string' ? JSON.parse(instructor.allowed_courses || '[]') : (instructor.allowed_courses || [])

    return NextResponse.json(instructor)
  } catch (error) {
    console.error("Failed to fetch instructor:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PATCH - Update instructor courses or demote
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const { allowedCourses, demote } = await request.json()

    // Get username
    const userResult = await query("SELECT username FROM accounts WHERE user_id = $1", [parseInt(id)])
    if (userResult.rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 })
    const username = userResult.rows[0].username

    if (demote) {
      // 1. Get role ID for 'user'
      const roleResult = await query("SELECT id FROM users_roles WHERE role = 'user'")
      const userRoleId = roleResult.rows[0].id

      // 2. Update role in accounts
      await query("UPDATE accounts SET role_id = $1 WHERE user_id = $2", [userRoleId, parseInt(id)])
      
      // 3. Deactivate in dashboard_users (optional, or just update role)
      await query("UPDATE dashboard_users SET role = $1, active = false WHERE username = $2", ['user', username])

      return NextResponse.json({ success: true, message: "User demoted to regular user" })
    }

    if (allowedCourses !== undefined) {
      const allowedCoursesJson = JSON.stringify(allowedCourses)
      await query("UPDATE dashboard_users SET allowed_courses = $1 WHERE username = $2", [allowedCoursesJson, username])
      return NextResponse.json({ success: true, message: "Instructor courses updated" })
    }

    return NextResponse.json({ error: "No changes provided" }, { status: 400 })
  } catch (error) {
    console.error("Failed to update instructor:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE - Remove instructor role (shorthand for demote)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const userResult = await query("SELECT username FROM accounts WHERE user_id = $1", [parseInt(id)])
    if (userResult.rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 })
    const username = userResult.rows[0].username

    const roleResult = await query("SELECT id FROM users_roles WHERE role = 'user'")
    const userRoleId = roleResult.rows[0].id

    await query("UPDATE accounts SET role_id = $1 WHERE user_id = $2", [userRoleId, parseInt(id)])
    await query("UPDATE dashboard_users SET role = $1, active = false WHERE username = $2", ['user', username])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete instructor role:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
