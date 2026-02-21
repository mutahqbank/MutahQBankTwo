import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

// GET full user detail
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
        a.username, a.active, a.role_id,
        r.role
      FROM users u
      JOIN accounts a ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      WHERE u.id = $1
    `, [parseInt(id)])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user subscriptions
    const subs = await query(`
      SELECT
        s.id, s.date, s.duration, s.active,
        c.course AS course_name,
        p.price
      FROM subscriptions s
      JOIN packages p ON s.package_id = p.id
      JOIN plans pl ON p.id = pl.package_id
      JOIN courses c ON pl.course_id = c.id
      WHERE s.user_id = $1
      ORDER BY s.date DESC
    `, [parseInt(id)])

    return NextResponse.json({
      user: result.rows[0],
      subscriptions: subs.rows,
    })
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

// PATCH - toggle ban (accounts.active)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const { active } = await request.json()

    const result = await query(
      `UPDATE accounts SET active = $1 WHERE user_id = $2 RETURNING user_id, username, active`,
      [active, parseInt(id)]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Failed to update user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// PUT - update profile fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()

    // Update users table
    if (body.first_name !== undefined || body.last_name !== undefined || body.phone !== undefined || body.email !== undefined) {
      await query(`
        UPDATE users SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone = COALESCE($3, phone),
          email = COALESCE($4, email)
        WHERE id = $5
      `, [body.first_name, body.last_name, body.phone, body.email, parseInt(id)])
    }

    // Update username in accounts
    if (body.username !== undefined) {
      await query(`UPDATE accounts SET username = $1 WHERE user_id = $2`, [body.username, parseInt(id)])
    }

    // Change password
    if (body.new_password) {
      const newHash = sha256(body.new_password)
      // If current_password is provided, verify it first
      if (body.current_password) {
        const existing = await query(`SELECT password_hash FROM accounts WHERE user_id = $1`, [parseInt(id)])
        if (existing.rows.length > 0 && existing.rows[0].password_hash !== sha256(body.current_password)) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
        }
      }
      await query(`UPDATE accounts SET password_hash = $1 WHERE user_id = $2`, [newHash, parseInt(id)])
    }

    // Return updated user
    const updated = await query(`
      SELECT u.id, u.first_name, u.last_name, u.phone, u.email,
             a.username, a.active, r.role
      FROM users u
      JOIN accounts a ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      WHERE u.id = $1
    `, [parseInt(id)])

    return NextResponse.json(updated.rows[0])
  } catch (error) {
    console.error("Failed to update profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
