"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Menu, LogOut, Users, Receipt, MessageSquare, Home, BookOpen, UserCircle, CreditCard, Settings } from "lucide-react"
import { useState, useRef, useEffect } from "react"

export function SiteHeader() {
  const { user, isAdmin, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link href="/" className="text-xl font-bold tracking-tight">
          mutah<span className="text-secondary">Q</span>bank
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" role="navigation">
          <Link href="/" className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground">
            <Home className="mr-1 inline-block h-4 w-4" />
            Home
          </Link>
          {!isAdmin && user && (
            <Link href="/my-courses" className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground">
              <BookOpen className="mr-1 inline-block h-4 w-4" />
              My Courses
            </Link>
          )}
          {isAdmin && (
            <>
              <Link href="/admin/users" className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                <Users className="mr-1 inline-block h-4 w-4" />
                Users
              </Link>
              <Link href="/admin/subscriptions" className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                <CreditCard className="mr-1 inline-block h-4 w-4" />
                Subscriptions
              </Link>
              <Link href="/admin/transactions" className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                <Receipt className="mr-1 inline-block h-4 w-4" />
                Transactions
              </Link>
              <Link href="/admin/feeds" className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                <MessageSquare className="mr-1 inline-block h-4 w-4" />
                Feeds
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium sm:inline-block">{user.username}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.full_name || user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                  <div className="-mx-1 my-1 h-px bg-muted" />
                  {isAdmin && (
                    <>
                      <Link
                        href="/admin/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Profile Settings
                      </Link>
                      <div className="-mx-1 my-1 h-px bg-muted" />
                    </>
                  )}
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false) }}
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <UserCircle className="h-5 w-5 text-primary-foreground/80" />
              <Link href="/login" className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                Log In
              </Link>
              <Link href="/register" className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-primary-foreground/10 px-4 pb-4 lg:hidden" role="navigation">
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/" className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => setMobileOpen(false)}>
              Home
            </Link>
            {!isAdmin && user && (
              <Link href="/my-courses" className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => setMobileOpen(false)}>
                My Courses
              </Link>
            )}
            {isAdmin && (
              <>
                <Link href="/admin/users" className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => setMobileOpen(false)}>
                  Users
                </Link>
                <Link href="/admin/subscriptions" className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => setMobileOpen(false)}>
                  Subscriptions
                </Link>
                <Link href="/admin/transactions" className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => setMobileOpen(false)}>
                  Transactions
                </Link>
                <Link href="/admin/feeds" className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => setMobileOpen(false)}>
                  Feeds
                </Link>
                <Link href="/admin/profile" className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => setMobileOpen(false)}>
                  Profile Settings
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
