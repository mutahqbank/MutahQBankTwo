"use client"

import { useState, useEffect } from "react"
import { FeaturedPackageCard, FeaturedPackage } from "./featured-package-card"
import { Loader2, Sparkles } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export function PackagesSection() {
  const { isAdmin } = useAuth()
  const [bundles, setBundles] = useState<FeaturedPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBundles() {
      try {
        const res = await fetch("/api/homepage/featured-packages")
        if (res.ok) {
          const data = await res.json()
          setBundles(data)
        }
      } catch (error) {
        console.error("Failed to fetch featured bundles:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBundles()
  }, [])

  // Fallback bundles if none are featured (Truly Vague)
  const fallbackBundles: FeaturedPackage[] = [
    {
      id: -1,
      price: 0,
      users_limit: 1,
      duration: 0,
      custom_name: null,
      design_level: null,
      courses: [],
      is_coming_soon: true
    },
    {
      id: -2,
      price: 0,
      users_limit: 1,
      duration: 0,
      custom_name: null,
      design_level: null,
      courses: [],
      is_coming_soon: true
    },
    {
      id: -3,
      price: 0,
      users_limit: 1,
      duration: 0,
      custom_name: null,
      design_level: null,
      courses: [],
      is_coming_soon: true
    }
  ]

  const displayBundles = bundles.length > 0 ? bundles : fallbackBundles

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    )
  }

  return (
    <section className="bg-gradient-to-b from-muted/30 to-background py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-secondary">
             <Sparkles className="h-3.5 w-3.5" />
             Special Offers
          </div>
          {isAdmin ? (
            <Link href="/admin/homepage/featured-packages" className="block group/title">
              <h2 className="text-4xl font-black text-foreground tracking-tight sm:text-6xl transition-colors group-hover/title:text-secondary cursor-pointer">
                Featured <span className="text-secondary underline decoration-secondary/30 underline-offset-8">Study Bundles</span>
              </h2>
            </Link>
          ) : (
            <h2 className="text-4xl font-black text-foreground tracking-tight sm:text-6xl">
              Featured <span className="text-secondary underline decoration-secondary/30 underline-offset-8">Study Bundles</span>
            </h2>
          )}
          <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground/80 leading-relaxed font-medium">
            Save time and money with our specially curated course packages designed for maximum exam success and comprehensive clinical mastery.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto items-stretch">
          {displayBundles.length >= 4 ? (
            <>
              {/* Column 1: 6th Year (Full height) */}
              <div className="flex flex-col h-full">
                <FeaturedPackageCard pkg={displayBundles[0]} />
              </div>
              
              {/* Column 2: Stacked 4th & 5th Year */}
              <div className="flex flex-col gap-8 h-full">
                <div className="flex-1">
                  <FeaturedPackageCard pkg={displayBundles[1]} isCompact={true} />
                </div>
                <div className="flex-1">
                  <FeaturedPackageCard pkg={displayBundles[2]} isCompact={true} />
                </div>
              </div>

              {/* Column 3: 5th Year Minors (Full height) */}
              <div className="flex flex-col h-full">
                <FeaturedPackageCard pkg={displayBundles[3]} />
              </div>

              {/* Any additional packages (if more than 4) */}
              {displayBundles.slice(4).map((pkg, index) => (
                <div key={pkg.id || index + 4} className="lg:col-span-1">
                  <FeaturedPackageCard pkg={pkg} />
                </div>
              ))}
            </>
          ) : displayBundles.length === 3 ? (
            <>
              {/* Corrected 2-column layout for exactly 3 packages */}
              <div className="lg:col-span-1 flex flex-col h-full">
                <FeaturedPackageCard pkg={displayBundles[0]} />
              </div>
              <div className="flex flex-col gap-8 h-full">
                <div className="flex-1">
                  <FeaturedPackageCard pkg={displayBundles[1]} isCompact={true} />
                </div>
                <div className="flex-1">
                  <FeaturedPackageCard pkg={displayBundles[2]} isCompact={true} />
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:col-span-2">
              {displayBundles.map((pkg, index) => (
                <FeaturedPackageCard key={pkg.id || index} pkg={pkg} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
