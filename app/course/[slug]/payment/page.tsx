"use client"

import { use, useState, useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Home, ChevronRight, Check, Upload, CreditCard, Users, BookOpen, Loader2, AlertTriangle, Ticket
} from "lucide-react"

// Global SWRProvider handles fetching and caching rules.

interface PkgCourse { id: number; name: string; questions_count: string | number }
interface DBPackage { id: number; price: number; original_price?: number | null; users_limit: number; duration: number; active: boolean; courses: PkgCourse[]; custom_name?: string | null; design_level?: string | null }
interface DBCourse { id: number; name: string; slug: string }

function getPackageTitle(usersLimit: number, coursesCount: number): string {
  if (usersLimit === 1 && coursesCount === 1) return "Normal package"
  if (usersLimit === 1 && coursesCount > 1) return "Package deal"
  if (usersLimit > 1 && coursesCount === 1) return "Group package"
  return "Group Package deal"
}

function getCourseBaseName(name: string) {
  return name.split('(')[0].trim().toLowerCase()
}

function getPackageDesignLevel(pkg: DBPackage): 'normal' | 'deal-same' | 'deal-diff' | 'special-gradient' | 'special-2' | 'special-3' {
  if (pkg.design_level && pkg.design_level !== 'normal' && pkg.design_level !== '') {
    return pkg.design_level as 'normal' | 'deal-same' | 'deal-diff' | 'special-gradient' | 'special-2' | 'special-3'
  }
  if (!pkg.courses || pkg.courses.length <= 1) return 'normal'
  const themes = new Set(pkg.courses.map(c => getCourseBaseName(c.name)))
  if (themes.size === 1) return 'deal-same'
  return 'deal-diff'
}

/* ─── Package selection card ─── */
function PackageOption({ pkg, isSelected, onSelect }: { pkg: DBPackage; isSelected: boolean; onSelect: () => void }) {
  const title = pkg.custom_name?.trim() ? pkg.custom_name : getPackageTitle(pkg.users_limit, pkg.courses?.length ?? 0)
  const totalQ = pkg.courses?.reduce((sum, c) => sum + Number(c.questions_count), 0) ?? 0
  const features = [
    "Subscribe for the end of the course",
    `View all ${totalQ.toLocaleString()} questions.`,
    "Clear explanations.",
    "Watch from anywhere.",
    "Timed tests and tutor-led exams.",
  ]

  const designLevel = getPackageDesignLevel(pkg)
  const hasDiscount = pkg.original_price && pkg.original_price > pkg.price
  const discountPercentage = hasDiscount ? Math.round(((pkg.original_price! - pkg.price) / pkg.original_price!) * 100) : 0

  // Default styles (Normal)
  let containerClass = "border-border shadow-sm bg-background hover:border-secondary/40"
  let iconContainer = pkg.users_limit > 1 ? "bg-slate-100 text-slate-500" : "bg-secondary/10 text-secondary"
  let badgeClass = ""
  let badgeText = ""

  if (designLevel === 'special-gradient' || designLevel === 'special-2' || designLevel === 'special-3') {
    let beamColor = "#f97316" // Orange for special-gradient
    let bgGradient = "from-orange-600 via-orange-500 to-amber-400"
    let checkIconColor = "text-amber-200"
    let badgeText = "SPECIAL"
    let badgeColor = "bg-white text-orange-600"

    if (designLevel === 'special-2') {
      beamColor = "#06b6d4" // Cyan
      bgGradient = "from-slate-900 via-blue-800 to-cyan-700"
      checkIconColor = "text-cyan-300"
      badgeText = "CYBER VALUE"
      badgeColor = "bg-cyan-500 text-white"
    } else if (designLevel === 'special-3') {
      beamColor = "#fbbf24" // Amber/Gold
      bgGradient = "from-zinc-950 via-indigo-950 to-amber-900"
      checkIconColor = "text-amber-400"
      badgeText = "ELITE PREMIUM"
      badgeColor = "bg-amber-500 text-white"
    }

    return (
      <div
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && onSelect()}
        className={`group relative p-[2px] overflow-hidden rounded-xl transition-all duration-500 hover:-translate-y-1 cursor-pointer
        ${isSelected ? `shadow-[0_0_30px_-5px_rgba(249,115,22,0.5)] ring-1 ring-white/20` : 'shadow-sm'}`}
      >
        <div 
          className={`absolute inset-[-1000%] ${isSelected ? "animate-[spin_3s_linear_infinite]" : "animate-[spin_8s_linear_infinite]"} opacity-90`}
          style={{ backgroundImage: `conic-gradient(from_0deg,transparent_0deg,transparent_310deg,${beamColor}_340deg,transparent_360deg)` }}
        />
        <div className={`relative flex flex-col h-full w-full overflow-hidden rounded-[calc(0.75rem-2px)] bg-gradient-to-br ${bgGradient} p-5`}>
           <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
              {pkg.users_limit > 1 ? <Users className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${badgeColor}`}>
                   {designLevel === 'special-gradient' ? 'Special' : designLevel === 'special-2' ? 'Cyber' : 'Elite'}
                </span>
              </div>
              <p className="text-xs text-white/80">{pkg.users_limit} user{pkg.users_limit > 1 ? "s" : ""}</p>
            </div>
            <div className="ml-auto text-right">
                <p className="text-xl font-bold text-white leading-none">
                    {pkg.price} <span className="text-xs font-normal text-white/80">JOD</span>
                </p>
                {hasDiscount && (
                    <p className="text-[10px] text-white/50 line-through mt-0.5 leading-none font-medium">
                        {pkg.original_price} JOD
                    </p>
                )}
                {hasDiscount && (
                    <div className="mt-1.5 inline-block px-1.5 py-0.5 rounded bg-white text-orange-600 text-[9px] font-black uppercase tracking-tighter shadow-md">
                        Save {discountPercentage}%
                    </div>
                )}
            </div>
          </div>
          <ul className="flex flex-col gap-1.5 flex-1">
            {features.map(f => (
              <li key={f} className="flex items-start gap-2 text-xs text-white">
                <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${checkIconColor}`} /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-white/20 pt-3">
            <h6 className="text-xs font-bold text-white mb-1.5">Courses Included:</h6>
            <ol className="flex flex-col list-decimal gap-1 pl-5 text-[11px] text-white/80 font-medium">
                {pkg.courses.map(c=> (
                  <li key={c.id || c.name}>{c.name}</li>
                ))}
            </ol>
          </div>
          {isSelected && (
            <div className={`mt-3 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-bold shadow-lg ${badgeColor}`}>
              <Check className="h-3.5 w-3.5" /> Selected
            </div>
          )}
        </div>
      </div>
    )
  }

  if (designLevel === 'deal-same') {
    containerClass = "border-blue-200 bg-white hover:border-blue-400"
    iconContainer = "bg-blue-50 text-blue-500"
    if (isSelected) containerClass = "border-blue-500 ring-2 ring-blue-500 bg-blue-50/30"
  } else if (designLevel === 'deal-diff') {
    containerClass = "border-amber-200 bg-white hover:border-amber-400 shadow-md"
    iconContainer = "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm"
    badgeClass = "absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-bl-lg uppercase tracking-tight z-10"
    badgeText = "Best Value"
    if (isSelected) containerClass = "border-amber-500 ring-2 ring-amber-500 bg-amber-50/30"
  } else {
    // Normal level
    if (isSelected) containerClass = "border-secondary ring-1 ring-secondary bg-secondary/5 shadow-lg"
  }

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onSelect()}
      className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all ${containerClass}`}
    >
      {badgeText && <div className={badgeClass}>{badgeText}</div>}
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconContainer}`}>
          {pkg.users_limit > 1 ? <Users className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{pkg.users_limit} user{pkg.users_limit > 1 ? "s" : ""}</p>
        </div>
        <div className="ml-auto text-right">
            <p className="text-xl font-bold text-foreground leading-none">
                {pkg.price} <span className="text-xs font-normal text-muted-foreground">JOD</span>
            </p>
            {hasDiscount && (
                <p className="text-[10px] text-muted-foreground/50 line-through mt-0.5 leading-none font-medium text-right">
                    {pkg.original_price} JOD
                </p>
            )}
            {hasDiscount && (
                <div className="mt-1.5 inline-block px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[9px] font-black uppercase tracking-tighter shadow-sm border border-secondary/20">
                    Save {discountPercentage}%
                </div>
            )}
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> {f}
          </li>
        ))}
      </ul>
       <div className="mt-3 border-t border-border pt-3">
            <h6 className="text-xs font-bold text-foreground mb-1.5">
              Courses Included:
            </h6>
            <ol className="flex flex-col list-decimal gap-1 pl-5 text-[11px] text-muted-foreground font-medium">
                {pkg.courses.map(c=> (
                  <li key={c.id || c.name}>{c.name}</li>
                ))}
            </ol>
          </div>
      {isSelected && (
        <div className={`mt-3 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-bold shadow-sm transition-all
          ${designLevel === 'deal-same' ? 'bg-blue-600 text-white' : 
            designLevel === 'deal-diff' ? 'bg-amber-500 text-white' : 
            'bg-secondary text-secondary-foreground'}`}>
          <Check className="h-3.5 w-3.5" /> Selected
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   Payment Page
   ═══════════════════════════════════════════ */
export default function PaymentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const searchParams = useSearchParams()
  const preselectedPkg = searchParams.get("pkg")
  const { user } = useAuth()

  const { data: course, isLoading: courseLoading } = useSWR<DBCourse>(`/api/courses/${slug}`)
  const { data: packages, isLoading: pkgLoading } = useSWR<DBPackage[]>(`/api/courses/${slug}/packages`)

  const [selectedPkg, setSelectedPkg] = useState<number | null>(preselectedPkg ? Number(preselectedPkg) : null)
  const [packageFilter, setPackageFilter] = useState<"individual" | "group">("individual")
  const [file, setFile] = useState<File | null>(null)
  const [coupon, setCoupon] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState("")

  // Set initial filter based on preselected package
  useMemo(() => {
    if (preselectedPkg && packages) {
      const pkg = packages.find(p => p.id === Number(preselectedPkg))
      if (pkg && pkg.users_limit > 1) {
        setPackageFilter("group")
      }
    }
  }, [preselectedPkg, packages])

  const selectedPackage = useMemo(() => packages?.find(p => p.id === selectedPkg), [packages, selectedPkg])
  const isGroup = (selectedPackage?.users_limit ?? 1) > 1

  // Validation: screenshot OR coupon required; group requires note
  const hasPaymentProof = !!file || !!coupon.trim()
  const hasGroupNote = !isGroup || note.trim().length > 0
  const canPurchase = !!selectedPkg && hasPaymentProof && hasGroupNote && !!user

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canPurchase || !selectedPackage || !user) return
    setSubmitting(true)
    setApiError("")

    try {
      const formData = new FormData()
      formData.append("user_id", String(user.id))
      formData.append("package_id", String(selectedPkg))
      formData.append("coupon", coupon.trim())
      formData.append("note", note.trim())
      if (file) {
        formData.append("screenshot", file)
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error || "Something went wrong.")
        setSubmitting(false)
        return
      }

      setSubmitting(false)
      setSubmitted(true)
    } catch (error) {
      console.error("Full error details:", error)
      setApiError(error instanceof Error ? error.message : "Connection error.")
      setSubmitting(false)
    }
  }

  if (courseLoading || pkgLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div>
  }

  if (!course) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Course not found</h2>
          <Link href="/" className="mt-4 inline-block text-secondary hover:underline">Back to Home</Link>
        </div>
      </div>
    )
  }

  /* ─── Not logged in ─── */
  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-background p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-bold text-foreground">Login Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">You must be logged in to purchase a subscription.</p>
          <Link href="/login">
            <Button className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">Log In</Button>
          </Link>
        </div>
      </div>
    )
  }

  /* ─── Success ─── */
  if (submitted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-background p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Payment Submitted!</h2>
          <p className="mt-2 text-sm text-muted-foreground">{"Please wait for the admin's approval."}</p>
          <Link href={`/course/${slug}`}>
            <Button className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">Back to Course</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="bg-muted/50 px-4 py-3" aria-label="Breadcrumb">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><Home className="h-3.5 w-3.5" /> Home</Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <Link href={`/course/${slug}`} className="text-muted-foreground hover:text-foreground">{course.name}</Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">Payment</span>
        </div>
      </nav>

      {/* Title */}
      <section className="bg-primary px-4 py-10">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-2xl font-bold text-primary-foreground md:text-3xl">Course Payment</h1>
          <p className="mt-2 text-sm text-primary-foreground/70">{course.name}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Payment Instructions */}
        <div className="mb-10 rounded-xl border border-border bg-muted/30 p-6">
          <h3 className="mb-4 font-bold text-foreground">Payment Instructions</h3>
          <div className="flex flex-col gap-3">
            {[
              "Select the desired package.",
              "Transfer the amount via CliQ, then upload a screenshot of the transfer.",
              "If you have a coupon code, enter it instead of uploading a screenshot.",
              "For group packages, list the names of all members in the note field.",
              "Wait for admin approval after submitting.",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">{i + 1}</span>
                <p className="text-sm text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method Info */}
        <div className="mb-10 rounded-xl border border-border bg-background p-6 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-28 items-center justify-center rounded-lg border border-border bg-muted/50">
              <span className="text-lg font-bold text-primary">CliQ</span>
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <p>CliQ name: <span className="font-bold text-foreground">MQBANK</span></p>
              <p>Recipient: <span className="font-bold text-foreground">Mohammad Radwan Mohammad Alzuraiqi</span></p>
              <p>Payment Method: <span className="font-bold text-foreground">{"Bank al Etihad (\u0628\u0646\u0643 \u0627\u0644\u0627\u062A\u062D\u0627\u062F)"}</span></p>
            </div>
          </div>
        </div>

        {/* Select Package */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-foreground">Choose Your Package</h3>
            
            <div className="inline-flex rounded-lg bg-muted/50 p-1">
              <button 
                type="button"
                onClick={() => setPackageFilter('individual')} 
                className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-semibold transition-all ${packageFilter === 'individual' ? 'bg-background shadow-sm text-secondary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Individual
              </button>
              <button 
                type="button"
                onClick={() => setPackageFilter('group')} 
                className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-semibold transition-all ${packageFilter === 'group' ? 'bg-background shadow-sm text-secondary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Group
              </button>
            </div>
          </div>

          {packages && packages.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {packages
                .filter(pkg => packageFilter === "individual" ? pkg.users_limit === 1 : pkg.users_limit > 1)
                .map(pkg => (
                <PackageOption key={pkg.id} pkg={pkg} isSelected={selectedPkg === pkg.id} onSelect={() => { setSelectedPkg(pkg.id); setApiError("") }} />
              ))}
              {packages.filter(pkg => packageFilter === "individual" ? pkg.users_limit === 1 : pkg.users_limit > 1).length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No {packageFilter} packages available for this course.</p>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No packages available for this course.</p>
          )}
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit}>
          <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <div className="bg-primary px-4 py-3">
              <h3 className="font-bold text-primary-foreground">Checkout</h3>
            </div>
            <div className="flex flex-col gap-5 p-6">

              {/* Error banner */}
              {apiError && (
                <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">{apiError}</p>
                </div>
              )}

              {/* File Upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Transfer Screenshot {!coupon.trim() && <span className="text-destructive">*</span>}
                </label>
                <div className={`flex items-center gap-3 rounded-md border border-dashed px-4 py-6 ${file ? "border-green-300 bg-green-50/50" : "border-input bg-muted/30"}`}>
                  <Upload className={`h-6 w-6 ${file ? "text-green-600" : "text-muted-foreground"}`} />
                  <div className="flex flex-col flex-1">
                    {file ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
                        <button type="button" onClick={() => setFile(null)} className="text-xs text-destructive hover:underline">Remove</button>
                      </div>
                    ) : (
                      <>
                        <label className="cursor-pointer text-sm font-medium text-secondary hover:underline">
                          Choose File
                          <input type="file" accept="image/*,.pdf" className="sr-only" onChange={e => {
                            if (e.target.files?.[0]) {
                              setFile(e.target.files[0])
                              if (coupon) setCoupon("") // Clear coupon when file is chosen
                            }
                          }} />
                        </label>
                        <span className="text-xs text-muted-foreground">JPG, PNG or PDF accepted</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Coupon Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">
                  <Ticket className="mr-1 inline-block h-4 w-4" />
                  Coupon Code {!file && <span className="text-destructive">*</span>}
                </label>
                <input
                  type="text"
                  value={coupon}
                  onChange={e => {
                    const val = e.target.value
                    setCoupon(val)
                    if (val.trim() && file) setFile(null) // Clear file when coupon is typed
                  }}
                  placeholder="Enter coupon code..."
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {!hasPaymentProof && selectedPkg && (
                <p className="text-xs text-amber-600">You must provide a transfer screenshot or a coupon code.</p>
              )}

              {/* Transfer Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Note {isGroup && <span className="text-destructive">* (required for group packages)</span>}
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={isGroup ? "List all member names here (required)..." : "Optional note..."}
                  rows={3}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {isGroup && !note.trim() && (
                  <p className="text-xs text-destructive">Group packages require a note listing all participant names.</p>
                )}
              </div>

              {/* Summary */}
              {selectedPackage && (
                <div className="rounded-md border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Package:</span>
                    <span className="font-medium text-foreground">{getPackageTitle(selectedPackage.users_limit, selectedPackage.courses?.length ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium text-foreground">Subscribe for the end of the course</span>
                  </div>
                  {selectedPackage.courses && selectedPackage.courses.length > 1 && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Courses:</span>
                      <span className="font-medium text-foreground text-right">{selectedPackage.courses.map(c => c.name).join(", ")}</span>
                    </div>
                  )}
                  <div className="mt-2 border-t border-border pt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Total:</span>
                    <span className="text-lg font-bold text-primary">
                      {coupon.trim() ? "0" : selectedPackage.price} JOD
                    </span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={!canPurchase || submitting}
                className="w-full bg-primary py-5 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                {submitting ? "Processing..." : "Purchase"}
              </Button>
              {!canPurchase && selectedPkg && (
                <p className="text-center text-xs text-muted-foreground">
                  {!hasPaymentProof ? "Upload a screenshot or enter a coupon code." : !hasGroupNote ? "Enter participant names in the note." : "Complete all required fields."}
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
