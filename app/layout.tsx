import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import "./globals.css"
import { SWRProvider } from "@/app/swr-provider"
import { AuthProvider } from "@/lib/auth-context"
import { AppShell } from "@/components/app-shell"

const _inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "mutahQbank - Medical Education Platform",
  description:
    "Comprehensive medical education platform with 18 courses, 579+ subjects, and 6723+ questions for medical students.",
}

export const viewport: Viewport = {
  themeColor: "#1a2332",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SWRProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  )
}
