"use client"

import { SWRConfig } from "swr"

const fetcher = async (url: string) => {
    const r = await fetch(url)
    if (!r.ok) {
        if (r.status === 401) {
            try {
                const errorData = await r.clone().json()
                if (errorData.error === "invalid_session" && window.location.pathname !== "/login") {
                    window.location.href = "/login?message=Session expired or logged in elsewhere"
                }
            } catch (e) { }
        }
        throw new Error("API Route Error")
    }
    return r.json()
}

export function SWRProvider({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                fetcher,
                // Prevent re-fetching when the user focuses the window
                revalidateOnFocus: false,
                // Deduplicate requests with the same key in this timespan
                dedupingInterval: 10000,
                // Only keep previous data when loading new data
                keepPreviousData: true,
            }}
        >
            {children}
        </SWRConfig>
    )
}
