"use client"

import Link from "next/link"
import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { BookOpen, ArrowRight, Clock, CheckCircle2, XCircle, Lock, Loader2, GraduationCap, Sparkles } from "lucide-react"

interface Subscription {
  id: number
  user_id: number
  package_id: number
  transaction_id: number | null
  date: string
  duration: number
  active: boolean
  course_id: number
  course_name: string
  hero_image: string | null
  price: number
  users_limit: number
  expires_at: string
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const exp = new Date(dateStr)
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ expiresAt, active }: { expiresAt: string; active: boolean }) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
        <XCircle className="h-3 w-3" />
        Expired
      </span>
    )
  }

  const days = daysUntil(expiresAt)

  if (days <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
        <XCircle className="h-3 w-3" />
        Expired
      </span>
    )
  }

  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning-foreground">
        <Clock className="h-3 w-3" />
        {days} day{days !== 1 ? "s" : ""} left
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
      <CheckCircle2 className="h-3 w-3" />
      {days} days left
    </span>
  )
}

function CourseCard({ sub }: { sub: Subscription }) {
  const isExpired = !sub.active || daysUntil(sub.expires_at) <= 0
  const formattedDate = new Date(sub.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${isExpired
      ? "border-border/50 bg-muted/30"
      : "border-border bg-card shadow-sm hover:-translate-y-1 hover:shadow-lg"
      }`}>
      {/* Background image / gradient header */}
      <div className="relative h-36 w-full overflow-hidden">
        {sub.hero_image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sub.hero_image}
              alt=""
              className={`h-full w-full object-cover transition-transform duration-500 ${isExpired ? "grayscale" : "group-hover:scale-105"
                }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary via-primary/90 to-secondary/40" />
        )}

        {/* Course name on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-balance text-lg font-bold leading-tight text-white drop-shadow-md">
            {sub.course_name}
          </h3>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Subscribed {formattedDate}
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-auto flex gap-2 pt-5">
          {isExpired ? (
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href={`/course/${sub.course_id}/payment`}>
                Renew Subscription
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link href={`/course/${sub.course_id}/session-dashboard`}>
                  Start Studying
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/course/${sub.course_id}`}>Details</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
        <GraduationCap className="h-10 w-10 text-secondary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">No courses yet</h2>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        You haven{"'"}t subscribed to any courses. Browse our catalog to find the right course for you and start your learning journey today.
      </p>
      <Button asChild className="mt-8 bg-secondary px-8 py-5 text-base font-semibold text-secondary-foreground hover:bg-secondary/90">
        <Link href="/#courses">
          <Sparkles className="mr-2 h-4 w-4" />
          Explore Our Courses
        </Link>
      </Button>
    </div>
  )
}

export default function MyCoursesPage() {
  const { user, isLoading: authLoading } = useAuth()

  const { data: subs, isLoading } = useSWR<Subscription[]>(
    user ? `/api/subscriptions?user_id=${user.id}` : null
  )

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Login Required</h1>
        <p className="mt-2 text-muted-foreground">
          You need to be logged in to view your courses.
        </p>
        <Button asChild className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    )
  }

  const activeSubs = (subs || []).filter(s => s.active && daysUntil(s.expires_at) > 0)
  const expiredSubs = (subs || []).filter(s => !s.active || daysUntil(s.expires_at) <= 0)

  if (!subs || subs.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Courses</h1>
        <p className="mt-1 text-muted-foreground">
          Your active subscriptions and learning progress.
        </p>
      </div>

      {/* Active subscriptions */}
      {activeSubs.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foreground">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Active Subscriptions
            <span className="ml-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              {activeSubs.length}
            </span>
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeSubs.map(sub => (
              <CourseCard key={`${sub.id}-${sub.course_id}`} sub={sub} />
            ))}
          </div>
        </section>
      )}

      {/* Expired subscriptions */}
      {expiredSubs.length > 0 && (
        <section>
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foreground">
            <XCircle className="h-5 w-5 text-destructive" />
            Expired
            <span className="ml-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
              {expiredSubs.length}
            </span>
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {expiredSubs.map(sub => (
              <CourseCard key={`${sub.id}-${sub.course_id}`} sub={sub} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
