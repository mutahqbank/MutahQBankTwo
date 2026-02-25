import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/database";

export async function POST() {
    const cookieStore = await cookies();
    
    try {
        const token = cookieStore.get("mutah_session")?.value;

        if (token) {
            // Use empty string to avoid NOT NULL constraint violation if NULL is forbidden
            await query("UPDATE accounts SET token = '' WHERE token = $1", [token]);
        }

        // Delete the cookie directly from the store
        cookieStore.delete("mutah_session");
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Session invalidation error:", error);

        // Clear the cookie even if DB update fails
        cookieStore.delete("mutah_session");
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}