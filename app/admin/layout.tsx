"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.replace("/")
        }
    }, [isLoading, isAdmin, router])

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!isAdmin) {
        return null
    }

    return <>{children}</>
}
