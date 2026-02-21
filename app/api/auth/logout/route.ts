import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { query } from "@/lib/database"

export async function POST() {
    const cookieStore = await cookies()
    const token = cookieStore.get("mutah_session")?.value

    if (token) {
        await query("UPDATE accounts SET token = NULL WHERE token = $1", [token])
        cookieStore.delete("mutah_session")
    }

    return NextResponse.json({ success: true })
}
