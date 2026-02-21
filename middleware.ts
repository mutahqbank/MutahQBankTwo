import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// The user IDs explicitly blocked from admin pages and API
const BLOCKED_ADMIN_IDS = [164, 500, 509]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Protect /admin and /api/admin routes at the edge level
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const token = request.cookies.get('mutah_session')?.value

        // 1. Missing session token 
        if (!token) {
            if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // 2. Fetch user details from /api/auth/me to verify session
        // (Middleware runs on the Edge runtime and cannot directly use the 'pg' module)
        try {
            const authUrl = new URL('/api/auth/me', request.url)
            const authReq = await fetch(authUrl, {
                headers: {
                    cookie: `mutah_session=${token}`
                }
            })

            if (!authReq.ok) {
                if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
                return NextResponse.redirect(new URL('/login', request.url))
            }

            const user = await authReq.json()

            // 3. Explicitly block specific user IDs from all admin access
            if (user.role !== 'admin' || BLOCKED_ADMIN_IDS.includes(user.id)) {
                if (pathname.startsWith('/api/')) {
                    return NextResponse.json({ error: 'Forbidden: Admin access revoked for this user.' }, { status: 403 })
                }
                // Redirect them to user dashboard
                return NextResponse.redirect(new URL('/my-courses', request.url))
            }

        } catch (error) {
            console.error('Middleware authentication error:', error)
            if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*']
}
