"use client"

import { useState, useEffect } from "react"
import { X, ExternalLink } from "lucide-react"
import Link from "next/link"

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const isDismissed = localStorage.getItem("announcement-dismissed")
    if (isDismissed) {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("announcement-dismissed", "true")
  }

  if (!isVisible) return null

  return (
    <div className="relative bg-primary py-2.5 px-4 text-primary-foreground shadow-md transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex-1 text-center text-sm font-medium">
          Limited Offer: <span className="text-secondary">4 Majors Bundle</span> — Ends Soon
          <Link 
            href="/subscriptions" 
            className="ml-3 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-0.5 text-[11px] font-bold text-secondary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            View Offer
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-md p-1 opacity-70 transition-opacity hover:bg-white/10 hover:opacity-100"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
