import { NextRequest, NextResponse } from "next/server"
import { createHash, randomBytes } from "crypto"
import { cookies } from "next/headers"
import { query } from "@/lib/database"

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, full_name, phone } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    // Check if username already exists in accounts
    const existingAccount = await query(
      `SELECT user_id FROM accounts WHERE LOWER(username) = LOWER($1)`,
      [username]
    )
    if (existingAccount.rows.length > 0) {
      return NextResponse.json({ error: "Username already exists." }, { status: 409 })
    }

    // Check if email already exists in users
    const existingEmail = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    )
    if (existingEmail.rows.length > 0) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 })
    }

    // Split full_name into first_name and last_name
    const nameParts = (full_name || "").trim().split(/\s+/)
    const firstName = nameParts[0] || username
    const lastName = nameParts.slice(1).join(" ") || null

    // Insert into users table first
    const userResult = await query(
      `INSERT INTO users (first_name, last_name, phone, email)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [firstName, lastName, phone || null, email]
    )
    const userId = userResult.rows[0].id

    // Insert into accounts table (role_id=2 is "user")
    const passwordHash = sha256(password)
    const token = randomBytes(32).toString("hex")

    await query(
      `INSERT INTO accounts (user_id, username, password_hash, token, role_id, active)
       VALUES ($1, $2, $3, $4, 2, true)`,
      [userId, username, passwordHash, token]
    )

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
      id: userId,
      username,
      email,
      full_name: [firstName, lastName].filter(Boolean).join(" "),
      phone: phone || null,
      role: "user",
      is_banned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error("Registration failed:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
