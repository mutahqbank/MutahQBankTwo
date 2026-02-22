"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"

function LoginForm() {
  const { user, login, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const messageQuery = searchParams.get("message")

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) router.push("/")
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.")
      return
    }

    setLoading(true)
    const result = await login(username, password)
    if (!result.success) {
      setError(result.error || "Login failed.")
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back to mutah<span className="text-secondary">Q</span>bank
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your courses and continue studying.
          </p>
        </div>

        {/* Message Alert from URL */}
        {messageQuery && !error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive shadow-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="text-sm font-medium leading-relaxed">{messageQuery}</div>
          </div>
        )}

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Error */}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            {/* Username */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">
                Username or Email
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/register" className="font-semibold text-secondary hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
