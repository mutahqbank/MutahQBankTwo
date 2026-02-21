"use client"

import { use } from "react"
import { redirect } from "next/navigation"

export default function SessionRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  redirect(`/course/${slug}/session-dashboard`)
}
