"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, UserPlus } from "lucide-react"

export default function RegisterPage() {
  const { user, register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    username: "",
    email: "",
    full_name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  if (user) {
    router.push("/")
    return null
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!form.username.trim() || !form.email.trim() || !form.password.trim() || !form.full_name.trim()) {
      setError("Please fill in all required fields.")
      return
    }

    if (form.username.length < 3) {
      setError("Username must be at least 3 characters.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.")
      return
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const result = await register({
      username: form.username,
      email: form.email,
      password: form.password,
      full_name: form.full_name,
      phone: form.phone,
    })
    if (result.success) {
      router.push("/")
    } else {
      setError(result.error || "Registration failed.")
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Join mutah<span className="text-secondary">Q</span>bank
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account and start preparing for your medical exams.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Error */}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="full_name" className="text-sm font-medium text-foreground">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Your full name"
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                autoFocus
              />
            </div>

            {/* Username */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                autoComplete="username"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="07XXXXXXXX"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                autoComplete="tel"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {"Already have an account? "}
          <Link href="/login" className="font-semibold text-secondary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
