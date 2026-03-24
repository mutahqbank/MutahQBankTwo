import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const result = await query(
      `SELECT * FROM site_announcements 
       WHERE is_active = TRUE 
       ORDER BY updated_at DESC 
       LIMIT 1`
    )

    if (result.rows.length === 0) {
      return NextResponse.json(null)
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Failed to fetch announcement:", error)
    return NextResponse.json({ error: "Failed to fetch announcement" }, { status: 500 })
  }
}
