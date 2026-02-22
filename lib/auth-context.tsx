"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { username: string; email: string; password: string; full_name: string; phone: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Rely on the secure HTTP-Only cookie to authenticate the session on load
    fetch("/api/auth/me")
      .then(async res => {
        if (res.ok) return res.json()

        // Handle invalid sessions explicitly
        const errorData = await res.json().catch(() => ({}))
        if (res.status === 401 && errorData.error === "invalid_session") {
          if (window.location.pathname !== "/login") {
            window.location.href = "/login?message=Session expired or logged in elsewhere"
          }
          throw new Error("Invalid session")
        }

        throw new Error("No active session")
      })
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))

    // Aggressive polling every 15 seconds to strictly enforce single-session on idle pages
    const intervalId = setInterval(() => {
      if (window.location.pathname !== "/login") {
        fetch("/api/auth/me").then(async res => {
          if (res.status === 401) {
            const errorData = await res.json().catch(() => ({}))
            if (errorData.error === "invalid_session" && window.location.pathname !== "/login") {
              window.location.href = "/login?message=Session expired or logged in elsewhere"
            }
          }
        }).catch(() => { })
      }
    }, 15000)

    return () => clearInterval(intervalId)
  }, [])

  const isAdmin = user?.role === "admin"

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data) // The backend already set the secure HTTP-Only cookie
        return { success: true }
      }
      return { success: false, error: data.error || "Login failed." }
    } catch {
      return { success: false, error: "Connection error. Please try again." }
    }
  }

  const register = async (data: { username: string; email: string; password: string; full_name: string; phone: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const resp = await res.json()
      if (res.ok) {
        setUser(resp) // The backend already set the secure HTTP-Only cookie
        return { success: true }
      }
      return { success: false, error: resp.error || "Registration failed." }
    } catch {
      return { success: false, error: "Connection error. Please try again." }
    }
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
