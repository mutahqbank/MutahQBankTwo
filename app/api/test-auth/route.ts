import { NextRequest, NextResponse } from "next/server"
import { getServerUser } from "@/lib/auth-server"
import { query, pool } from "@/lib/database"

export async function GET(request: NextRequest) {
  const diagnostic: any = {
    timestamp: new Date().toISOString(),
    env: {
      has_db_url: !!process.env.DATABASE_URL,
      has_gemini_key: !!process.env.GEMINI_API_KEY,
    }
  }

  try {
    const dbTest = await query("SELECT NOW()")
    diagnostic.db_connection = "OK"
    diagnostic.db_time = dbTest.rows[0].now
    diagnostic.pool_info = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    }
  } catch (e: any) {
    diagnostic.db_connection = "FAILED"
    diagnostic.db_error = e.message
  }

  try {
    const user = await getServerUser()
    diagnostic.user = user ? { id: user.id, role: user.role, username: user.username } : "NONE"
    const cookie = request.cookies.get("mutah_session")?.value
    diagnostic.has_session_cookie = !!cookie
    diagnostic.session_cookie_length = cookie?.length || 0
  } catch (e: any) {
    diagnostic.user_check_error = e.message
  }

  return NextResponse.json(diagnostic)
}
