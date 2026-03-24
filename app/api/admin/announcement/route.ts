import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await query(
      `SELECT * FROM site_announcements 
       ORDER BY updated_at DESC 
       LIMIT 1`
    )

    if (result.rows.length === 0) {
      return NextResponse.json(null)
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Failed to fetch admin announcement:", error)
    return NextResponse.json({ error: "Failed to fetch announcement" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id, title, description, target_date, button_text, button_link, is_active } = await request.json()

    if (!id) {
        // Create new if id is missing? Or just update the first one.
        // For simplicity, let's assume we always have one.
        return NextResponse.json({ error: "Announcement ID required" }, { status: 400 })
    }

    const result = await query(
      `UPDATE site_announcements 
       SET title = $1, 
           description = $2, 
           target_date = $3, 
           button_text = $4, 
           button_link = $5, 
           is_active = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [title, description, target_date, button_text, button_link, is_active, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Failed to update announcement:", error)
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 })
  }
}
