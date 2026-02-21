"use client"

import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
