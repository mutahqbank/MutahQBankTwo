import { NextResponse } from "next/server"
import { getServerUser } from "@/lib/auth-server"
import { cookies } from "next/headers"

export async function GET() {
    const cookieStore = await cookies()
    const hasToken = !!cookieStore.get("mutah_session")?.value
    const user = await getServerUser()

    if (!user) {
        // If they had a token but didn't get a user back, it must be an invalid session token
        if (hasToken) {
            return NextResponse.json({ error: "invalid_session", user: null }, { status: 401 })
        }
        return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
        phone: user.phone,
        role: user.role === "admin" ? "admin" : "user",
        is_banned: false,
    })
}
