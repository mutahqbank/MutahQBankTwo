import { cookies } from "next/headers"
import { query } from "@/lib/database"

export async function getServerUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get("mutah_session")?.value

    if (!token) return null

    try {
        const result = await query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        a.username,
        r.role
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      WHERE a.token = $1 AND a.active = true
    `, [token])

        if (result.rows.length === 0) return null

        return result.rows[0]
    } catch (error) {
        console.error("Failed to authenticate session token:", error)
        return null
    }
}
