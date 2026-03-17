import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

// GET - List all instructors OR search for users to promote
export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = request.nextUrl
  const mode = searchParams.get("mode") // 'list' or 'search'
  const search = searchParams.get("search") || ""

  try {
    if (mode === "search") {
      // Search for users who are NOT current instructors or admins
      const users = await query(`
        SELECT u.id, u.first_name, u.last_name, u.email, a.username, r.role
        FROM users u
        JOIN accounts a ON a.user_id = u.id
        JOIN users_roles r ON a.role_id = r.id
        WHERE (LOWER(a.username) LIKE LOWER($1) OR LOWER(u.email) LIKE LOWER($1) OR LOWER(u.first_name) LIKE LOWER($1) OR LOWER(u.last_name) LIKE LOWER($1))
        AND r.role = 'user'
        LIMIT 10
      `, [`%${search}%`])
      return NextResponse.json(users.rows)
    }

    // Default mode: list all current instructors
    const instructors = await query(`
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone,
        a.username, a.active,
        r.role,
        du.allowed_courses
      FROM users u
      JOIN accounts a ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      LEFT JOIN dashboard_users du ON a.username = du.username
      WHERE r.role = 'instructor'
      ORDER BY u.id ASC
    `)

    // Parse allowed_courses for each instructor
    const parsedInstructors = instructors.rows.map(inst => ({
      ...inst,
      allowed_courses: typeof inst.allowed_courses === 'string' ? JSON.parse(inst.allowed_courses || '[]') : (inst.allowed_courses || [])
    }))

    return NextResponse.json(parsedInstructors)
  } catch (error) {
    console.error("Failed to fetch instructors:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST - Promote a user to instructor
export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { userId, allowedCourses } = await request.json()

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })

    // 1. Get role ID for 'instructor'
    const roleResult = await query("SELECT id FROM users_roles WHERE role = 'instructor'")
    if (roleResult.rows.length === 0) return NextResponse.json({ error: "Instructor role not found" }, { status: 500 })
    const instructorRoleId = roleResult.rows[0].id

    // 2. Update user's role in accounts table
    const accountResult = await query(`
      UPDATE accounts 
      SET role_id = $1 
      WHERE user_id = $2 
      RETURNING username
    `, [instructorRoleId, userId])

    if (accountResult.rows.length === 0) return NextResponse.json({ error: "User account not found" }, { status: 404 })
    const username = accountResult.rows[0].username

    // 3. Update or Insert into dashboard_users
    const allowedCoursesJson = JSON.stringify(allowedCourses || [])
    
    // Check if entry exists
    const dashResult = await query("SELECT id FROM dashboard_users WHERE username = $1", [username])
    
    if (dashResult.rows.length > 0) {
      await query(`
        UPDATE dashboard_users 
        SET allowed_courses = $1, role_id = $2, active = true 
        WHERE username = $3
      `, [allowedCoursesJson, instructorRoleId, username])
    } else {
      await query(`
        INSERT INTO dashboard_users (username, allowed_courses, role_id, active)
        VALUES ($1, $2, $3, true)
      `, [username, allowedCoursesJson, instructorRoleId])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to promote user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
