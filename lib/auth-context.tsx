"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isInstructor: boolean
  isLoading: boolean
  refreshUser: () => Promise<void>
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { username: string; email: string; password: string; full_name: string; phone: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isInstructor: false,
  isLoading: true,
  refreshUser: async () => { },
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        const errorData = await res.json().catch(() => ({}))
        if (res.status === 401 && errorData.error === "invalid_session") {
          if (window.location.pathname !== "/login") {
            window.location.href = "/login?message=Session expired or logged in elsewhere"
          }
        }
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    // Aggressive polling every 5 minutes to continuously enforce single-session on idle pages
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
    }, 300000)

    return () => clearInterval(intervalId)
  }, [])

  const isAdmin = !!(user && user.role === "admin")
  const isInstructor = !!(user && user.role === "instructor")

  const refreshUser = async () => {
    setIsLoading(true)
    await fetchUser()
  }

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
    <AuthContext.Provider value={{ user, isAdmin, isInstructor, isLoading, refreshUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
