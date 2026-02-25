import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BLOCKED_ADMIN_IDS = [164, 500, 509]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const token = request.cookies.get('mutah_session')?.value

        if (!token) {
            if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            return NextResponse.redirect(new URL('/login', request.url))
        }

        try {
            const authUrl = new URL('/api/auth/me', request.url)
            const authReq = await fetch(authUrl, {
                headers: { cookie: `mutah_session=${token}` }
            })

            if (!authReq.ok) {
                let urlSuffix = ""
                if (authReq.status === 401) {
                    try {
                        const errorData = await authReq.json()
                        if (errorData.error === "invalid_session") {
                            urlSuffix = "?message=Session expired or logged in elsewhere"
                        }
                    } catch (e) {
                        // Ignore JSON parsing errors
                    }
                }

                const response = pathname.startsWith('/api/')
                    ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
                    : NextResponse.redirect(new URL(`/login${urlSuffix}`, request.url));

                // Delete cookie on the outgoing response (Edge runtime)
                response.cookies.delete('mutah_session');
                return response;
            }

            const user = await authReq.json()

            if (user.role !== 'admin' || BLOCKED_ADMIN_IDS.includes(user.id)) {
                if (pathname.startsWith('/api/')) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
                }
                return NextResponse.redirect(new URL('/my-courses', request.url))
            }

        } catch (error) {
            console.error('Middleware authentication error:', error)
            
            // Edge Case: If the fetch fails completely (e.g., network error), force a logout
            const response = pathname.startsWith('/api/') 
                ? NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
                : NextResponse.redirect(new URL('/login', request.url));
                
            response.cookies.delete('mutah_session');
            return response;
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*']
}