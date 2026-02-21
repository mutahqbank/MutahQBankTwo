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
interface DBPackage { id: number; price: number; users_limit: number; duration: number; active: boolean; courses: PkgCourse[] }
interface DBCourse { id: number; name: string; slug: string }

function getPackageTitle(usersLimit: number, coursesCount: number): string {
  if (usersLimit === 1 && coursesCount === 1) return "Normal package"
  if (usersLimit === 1 && coursesCount > 1) return "Package deal"
  if (usersLimit > 1 && coursesCount === 1) return "Group package"
  return "Group Package deal"
}

/* ─── Package selection card ─── */
function PackageOption({ pkg, isSelected, onSelect }: { pkg: DBPackage; isSelected: boolean; onSelect: () => void }) {
  const title = getPackageTitle(pkg.users_limit, pkg.courses?.length ?? 0)
  const totalQ = pkg.courses?.reduce((sum, c) => sum + Number(c.questions_count), 0) ?? 0
  const features = [
    "Subscribe for the end of the course",
    `View all ${totalQ.toLocaleString()} questions.`,
    "Clear explanations.",
    "Watch from anywhere.",
    "Timed tests and tutor-led exams.",
  ]
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onSelect()}
      className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${isSelected ? "border-secondary bg-secondary/5 shadow-lg" : "border-border bg-background shadow-sm hover:border-secondary/40"}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${pkg.users_limit > 1 ? "bg-primary/10" : "bg-secondary/10"}`}>
          {pkg.users_limit > 1 ? <Users className="h-5 w-5 text-primary" /> : <BookOpen className="h-5 w-5 text-secondary" />}
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{pkg.users_limit} user{pkg.users_limit > 1 ? "s" : ""}</p>
        </div>
        <span className="ml-auto text-xl font-bold text-foreground">{pkg.price} <span className="text-xs font-normal text-muted-foreground">JOD</span></span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> {f}
          </li>
        ))}
      </ul>
      {pkg.courses && pkg.courses.length > 1 && (
        <p className="mt-2 text-xs text-muted-foreground">Includes: {pkg.courses.map(c => c.name).join(", ")}</p>
      )}
      {isSelected && (
        <div className="mt-3 flex items-center justify-center gap-1 rounded-md bg-secondary py-1.5 text-xs font-semibold text-secondary-foreground">
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
  const [file, setFile] = useState<File | null>(null)
  const [coupon, setCoupon] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState("")

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
          <h3 className="mb-4 text-lg font-bold text-foreground">Choose Your Package</h3>
          {packages && packages.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {packages.map(pkg => (
                <PackageOption key={pkg.id} pkg={pkg} isSelected={selectedPkg === pkg.id} onSelect={() => { setSelectedPkg(pkg.id); setApiError("") }} />
              ))}
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
