import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    const whereClause = search
      ? `WHERE LOWER(a.username) LIKE LOWER($1) OR LOWER(u.email) LIKE LOWER($1) OR LOWER(u.first_name) LIKE LOWER($1) OR LOWER(u.last_name) LIKE LOWER($1)`
      : ""

    const dataParams: unknown[] = search ? [`%${search}%`] : []

    const sql = `
      SELECT
        u.id,
        a.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        r.role,
        a.active
      FROM users u
      JOIN accounts a ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      ${whereClause}
      ORDER BY u.id ASC
      LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}
    `
    dataParams.push(limit, offset)
    const result = await query(sql, dataParams)

    const countParams: unknown[] = search ? [`%${search}%`] : []
    const countSql = `
      SELECT COUNT(*) FROM users u
      JOIN accounts a ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      ${whereClause}
    `
    const countResult = await query(countSql, countParams)

    return NextResponse.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    })
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
