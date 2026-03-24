"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Timer, X } from "lucide-react"
import { Button } from "./ui/button"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface AnnouncementData {
    id: number
    title: string
    description: string
    target_date: string
    button_text: string
    button_link: string
    is_active: boolean
}

export function FeaturedAnnouncement() {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const calculateTimeLeft = useCallback((targetDateStr: string) => {
    const targetDate = new Date(targetDateStr)
    const now = new Date().getTime()
    const difference = targetDate.getTime() - now

    if (difference <= 0) {
      return null
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    }
  }, [])

  useEffect(() => {
    // Fetch announcement data
    fetch("/api/announcement")
        .then(res => res.json())
        .then(data => {
            if (data && data.is_active) {
                setAnnouncement(data)
                // Show after a short delay for better "floating" feel
                setTimeout(() => setIsVisible(true), 1000)
            }
        })
        .catch(err => console.error("Failed to fetch announcement:", err))
  }, [])

  useEffect(() => {
    if (!announcement) return

    // Initial calculation
    setTimeLeft(calculateTimeLeft(announcement.target_date))

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(announcement.target_date))
    }, 1000)

    return () => clearInterval(timer)
  }, [announcement, calculateTimeLeft])

  const handleDismiss = () => {
    setIsVisible(false)
    // Add a short delay before removing from DOM to allow animation
    setTimeout(() => {
        setIsDismissed(true)
    }, 300)
  }

  if (isDismissed || !announcement || !timeLeft) return null

  return (
    <div 
        className={`fixed bottom-6 right-6 z-50 max-w-[400px] transition-all duration-500 transform ${
            isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95"
        }`}
    >
      <div className="group overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/90 p-6 text-white shadow-2xl ring-1 ring-white/20">
        {/* Close Button */}
        <button 
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-full bg-white/10 p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
        >
            <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary/20 px-3 py-0.5 text-[10px] font-semibold tracking-wide text-secondary ring-1 ring-secondary/30 uppercase">
            Limited Time Offer
          </div>
          <h2 className="mb-2 text-xl font-bold tracking-tight">
            {announcement.title}
          </h2>
          <p className="mb-5 text-sm text-primary-foreground/80 line-clamp-2">
            {announcement.description}
          </p>

          <div className="mb-6 grid grid-cols-4 gap-3">
            <TimerUnit value={timeLeft.days} label="Days" />
            <TimerUnit value={timeLeft.hours} label="Hours" />
            <TimerUnit value={timeLeft.minutes} label="Min" />
            <TimerUnit value={timeLeft.seconds} label="Sec" />
          </div>

          <Link
            href={announcement.button_link}
            className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-secondary px-6 py-2.5 text-sm font-bold text-secondary-foreground shadow-lg transition-all hover:scale-[1.02] hover:bg-secondary/90 active:scale-95"
          >
            <span>{announcement.button_text}</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function TimerUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex bg-white/10 backdrop-blur-sm rounded-md border border-white/10 px-2 py-1.5 min-w-[50px] justify-center items-center shadow-inner">
        <span className="text-xl font-black text-secondary tabular-nums leading-none">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1 text-[8px] font-bold uppercase tracking-widest text-primary-foreground/60">{label}</span>
    </div>
  )
}
