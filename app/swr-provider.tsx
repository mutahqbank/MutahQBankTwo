"use client"

import { SWRConfig } from "swr"

const fetcher = (url: string) => fetch(url).then(r => {
    if (!r.ok) throw new Error("API Route Error")
    return r.json()
})

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
