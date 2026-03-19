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
        r.role,
        du.allowed_courses
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      JOIN users_roles r ON a.role_id = r.id
      LEFT JOIN dashboard_users du ON a.username = du.username
      WHERE a.token = $1 AND a.active = true
    `, [token])

        if (result.rows.length === 0) return null

        const user = result.rows[0]
        if (user.role) user.role = user.role.toLowerCase()
        
        // Ensure allowed_courses is an array
        if (typeof user.allowed_courses === 'string') {
          try {
            user.allowed_courses = JSON.parse(user.allowed_courses)
          } catch {
            user.allowed_courses = []
          }
        } else if (!user.allowed_courses) {
          user.allowed_courses = []
        }

        return user
    } catch (error: any) {
        console.error("SERVER AUTH ERROR:", error.message, error.stack);
        return null
    }
}
