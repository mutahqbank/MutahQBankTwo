import { NextResponse } from "next/server"
import { getServerUser } from "@/lib/auth-server"

export async function GET() {
    const user = await getServerUser()

    if (!user) {
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
