import { NextRequest, NextResponse } from "next/server"
import { createHash, randomBytes } from "crypto"
import { cookies } from "next/headers"
import { query } from "@/lib/database"

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // accounts table has: user_id, username, password_hash, token, role_id, active (no 'id' column)
    const result = await query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.phone,
        u.email,
        a.username,
        a.password_hash,
        a.active,
        r.role
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      WHERE LOWER(a.username) = LOWER($1) OR LOWER(u.email) = LOWER($1)
    `, [username])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 })
    }

    const user = result.rows[0]

    // Passwords are stored as SHA-256 hex hashes (64 chars)
    const inputHash = sha256(password)
    if (user.password_hash && user.password_hash !== inputHash) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 })
    }

    if (!user.active) {
      return NextResponse.json({ error: "Your account has been suspended. Contact support." }, { status: 403 })
    }

    // Generate session token
    const token = randomBytes(32).toString("hex")

    // Save token to database
    await query(`UPDATE accounts SET token = $1 WHERE username = $2`, [token, user.username])

    // Set HTTP-Only Cookie
    const cookieStore = await cookies()
    cookieStore.set("mutah_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
    })

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
      phone: user.phone,
      role: user.role === "admin" ? "admin" : "user",
      is_banned: !user.active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Login failed:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
