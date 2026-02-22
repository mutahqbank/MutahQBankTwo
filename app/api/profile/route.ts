import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

function sha256(input: string): string {
    return createHash("sha256").update(input).digest("hex")
}

// PUT - update own profile fields
export async function PUT(request: NextRequest) {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await request.json()

        // Update users table (Personal Info)
        if (body.first_name !== undefined || body.last_name !== undefined || body.phone !== undefined || body.email !== undefined) {
            await query(`
        UPDATE users SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone = COALESCE($3, phone),
          email = COALESCE($4, email)
        WHERE id = $5
      `, [body.first_name, body.last_name, body.phone, body.email, user.id])
        }

        // Update username in accounts
        if (body.username !== undefined) {
            // Check if username already exists for a different user
            const existingUsername = await query(`SELECT user_id FROM accounts WHERE username = $1 AND user_id != $2`, [body.username, user.id])
            if (existingUsername.rows.length > 0) {
                return NextResponse.json({ error: "Username already taken" }, { status: 400 })
            }
            await query(`UPDATE accounts SET username = $1 WHERE user_id = $2`, [body.username, user.id])
        }

        // Change password
        if (body.new_password) {
            const newHash = sha256(body.new_password)
            // If current_password is provided, verify it first against the database
            if (body.current_password) {
                const existing = await query(`SELECT password_hash FROM accounts WHERE user_id = $1`, [user.id])
                if (existing.rows.length > 0 && existing.rows[0].password_hash !== sha256(body.current_password)) {
                    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
                }
            } else {
                return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 })
            }

            await query(`UPDATE accounts SET password_hash = $1 WHERE user_id = $2`, [newHash, user.id])
        }

        // Return updated user payload
        const updated = await query(`
      SELECT u.id, u.first_name, u.last_name, u.phone, u.email,
             a.username, a.active, r.role
      FROM users u
      JOIN accounts a ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      WHERE u.id = $1
    `, [user.id])

        return NextResponse.json(updated.rows[0])
    } catch (error) {
        console.error("Failed to update profile:", error)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }
}
