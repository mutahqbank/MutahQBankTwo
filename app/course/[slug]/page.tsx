"use client"

import { use, useState, useCallback } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  BookOpen, FileQuestion, FileText, Timer, Users, UserCheck,
  Home, ChevronRightIcon, Edit3, Loader2, Save, X, Plus, Trash2,
  Check, Pencil, ToggleLeft, ToggleRight, ImageIcon, ChevronDown
} from "lucide-react"

const fetcher_deprecated = null // Global provider is used

const BLOCKED_ADMIN_IDS = [164, 500, 509]

/* ─── Types ─── */
interface DBSubject { id: number; name: string; course_id: number; active: boolean; question_count: string | number }
interface DBCourse { id: number; name: string; slug: string; description: string | null; about: string | null; is_active: boolean; hero_image: string | null; total_subjects: string | number; total_questions: string | number }
interface PkgCourse { id: number; name: string; questions_count: string | number }
interface DBPackage { id: number; price: number; users_limit: number; duration: number; active: boolean; courses: PkgCourse[] }
interface AllCourse { id: number; name: string; questions_count: string | number }

function getPackageTitle(usersLimit: number, coursesCount: number): string {
  if (usersLimit === 1 && coursesCount === 1) return "Normal package"
  if (usersLimit === 1 && coursesCount > 1) return "Package deal"
  if (usersLimit > 1 && coursesCount === 1) return "Group package"
  return "Group Package deal"
}

/* ═══════════════════════════════════════════
   Course Edit Form
   ═══════════════════════════════════════════ */
function CourseEditForm({ course, slug, onDone }: { course: DBCourse; slug: string; onDone: () => void }) {
  const [form, setForm] = useState({
    name: course.name, description: course.description || "", about: course.about || "",
    is_active: course.is_active, hero_image: course.hero_image || "",
  })
  const [saving, setSaving] = useState(false)
  const save = async () => {
    setSaving(true)
    await fetch(`/api/courses/${slug}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    await globalMutate(`/api/courses/${slug}`)
    setSaving(false); onDone()
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">Course Active:</span>
        <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className="text-foreground">
          {form.is_active ? <ToggleRight className="h-7 w-7 text-green-500" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
        </button>
        <span className={`text-xs font-medium ${form.is_active ? "text-green-600" : "text-muted-foreground"}`}>{form.is_active ? "Active" : "Inactive"}</span>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Course Name</label>
        <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground"><ImageIcon className="mr-1 inline h-4 w-4" /> Background Image URL</label>
        <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary" value={form.hero_image} onChange={e => setForm(f => ({ ...f, hero_image: e.target.value }))} placeholder="https://res.cloudinary.com/..." />
        {form.hero_image && <img src={form.hero_image} alt="Preview" className="mt-2 h-24 w-full rounded-md object-cover" />}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Short Description</label>
        <textarea className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">About (detailed)</label>
        <textarea className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary" rows={5} value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} />
      </div>
      <div className="flex gap-3">
        <Button onClick={save} disabled={saving} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Course Info
        </Button>
        <Button variant="outline" onClick={onDone}><X className="mr-2 h-4 w-4" /> Cancel</Button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Editable Subject Row
   ═══════════════════════════════════════════ */
function EditableSubjectRow({ subject, index, slug }: { subject: DBSubject; index: number; slug: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(subject.name)
  const [busy, setBusy] = useState(false)
  const toggleActive = async () => { setBusy(true); await fetch(`/api/courses/${slug}/subjects`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: subject.id, active: !subject.active }) }); await globalMutate(`/api/courses/${slug}/subjects?all=true`); setBusy(false) }
  const saveName = async () => { if (!name.trim()) return; setBusy(true); await fetch(`/api/courses/${slug}/subjects`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: subject.id, name: name.trim() }) }); await globalMutate(`/api/courses/${slug}/subjects?all=true`); setBusy(false); setEditing(false) }
  const deleteSubject = async () => { if (!confirm(`Delete subject "${subject.name}"?`)) return; setBusy(true); await fetch(`/api/courses/${slug}/subjects`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: subject.id }) }); await globalMutate(`/api/courses/${slug}/subjects?all=true`); setBusy(false) }
  return (
    <div className={`flex items-center justify-between border-b border-border px-4 py-3 transition-colors hover:bg-muted/50 ${!subject.active ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">{String(index + 1).padStart(2, "0")}</span>
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm text-foreground" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveName()} autoFocus />
            <button onClick={saveName} disabled={busy} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
            <button onClick={() => { setEditing(false); setName(subject.name) }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        ) : <span className="text-sm font-medium text-foreground truncate">{subject.name}</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-xs text-muted-foreground">{subject.question_count} Q</span>
        {!editing && <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>}
        <button onClick={toggleActive} disabled={busy}>{subject.active ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}</button>
        <button onClick={deleteSubject} disabled={busy} className="text-destructive/60 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  )
}

function SubjectRow({ subject, index }: { subject: DBSubject; index: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">{String(index + 1).padStart(2, "0")}</span>
        <span className="text-sm font-medium text-foreground">{subject.name}</span>
      </div>
      <span className="text-xs text-muted-foreground">{subject.question_count} Q</span>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Multi-Select Courses Dropdown
   ═══════════════════════════════════════════ */
function CourseMultiSelect({ allCourses, selected, onChange }: { allCourses: AllCourse[]; selected: number[]; onChange: (ids: number[]) => void }) {
  const [open, setOpen] = useState(false)
  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter(c => c !== id) : [...selected, id])
  }
  const selectedNames = allCourses.filter(c => selected.includes(c.id)).map(c => c.name)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm text-foreground">
        <span className="truncate">{selectedNames.length > 0 ? `${selectedNames.length} course(s) selected` : "Select courses..."}</span>
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
          {allCourses.map(c => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
              <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 rounded border-border accent-secondary" />
              <span className="flex-1 text-popover-foreground">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.questions_count} Q</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   Admin Package Editor Row
   ═══════════════════════════════════════════ */
function AdminPackageRow({
  pkg, slug, allCourses, isNew, onCancelNew,
}: {
  pkg: DBPackage | null; slug: string; allCourses: AllCourse[]; isNew?: boolean; onCancelNew?: () => void
}) {
  const [editing, setEditing] = useState(isNew || false)
  const [form, setForm] = useState({
    price: pkg?.price ?? 0,
    users_limit: pkg?.users_limit ?? 1,
    duration: pkg?.duration ?? 30,
    course_ids: pkg?.courses?.map(c => c.id) ?? [],
  })
  const [busy, setBusy] = useState(false)

  const dynamicTitle = getPackageTitle(form.users_limit, form.course_ids.length)
  const canSave = form.price > 0 && form.users_limit >= 1 && form.course_ids.length > 0

  const save = async () => {
    if (!canSave) return
    setBusy(true)
    if (isNew) {
      await fetch(`/api/courses/${slug}/packages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      onCancelNew?.()
    } else if (pkg) {
      await fetch(`/api/courses/${slug}/packages`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pkg.id, ...form }) })
      setEditing(false)
    }
    await globalMutate(`/api/courses/${slug}/packages?all=true`)
    setBusy(false)
  }

  const toggleActive = async () => {
    if (!pkg) return
    setBusy(true)
    await fetch(`/api/courses/${slug}/packages`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pkg.id, active: !pkg.active }) })
    await globalMutate(`/api/courses/${slug}/packages?all=true`)
    setBusy(false)
  }

  const deletePkg = async () => {
    if (!pkg || !confirm("Delete this package?")) return
    setBusy(true)
    await fetch(`/api/courses/${slug}/packages`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pkg.id }) })
    await globalMutate(`/api/courses/${slug}/packages?all=true`)
    setBusy(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-border bg-background p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">{dynamicTitle}</span>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={busy || !canSave} className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"><Check className="mr-1 inline h-3.5 w-3.5" />Save</button>
            <button onClick={() => { isNew ? onCancelNew?.() : setEditing(false) }} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"><X className="mr-1 inline h-3.5 w-3.5" />Cancel</button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Price (JOD)</label>
            <input type="number" min={0} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Users Limit</label>
            <input type="number" min={1} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" value={form.users_limit} onChange={e => setForm(f => ({ ...f, users_limit: +e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Duration (days)</label>
            <input type="number" min={1} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Courses</label>
            <CourseMultiSelect allCourses={allCourses} selected={form.course_ids} onChange={ids => setForm(f => ({ ...f, course_ids: ids }))} />
          </div>
        </div>
        {!canSave && <p className="mt-3 text-xs text-destructive">Fill all fields: price, users limit, and at least 1 course.</p>}
      </div>
    )
  }

  if (!pkg) return null

  const title = getPackageTitle(pkg.users_limit, pkg.courses?.length ?? 0)
  return (
    <div className={`rounded-lg border border-border bg-background p-5 shadow-sm ${!pkg.active ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="rounded bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">{title}</span>
          <span className="text-xl font-bold text-foreground">{pkg.price} <span className="text-sm font-normal text-muted-foreground">JOD</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleActive} disabled={busy}>{pkg.active ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}</button>
          <button onClick={() => { setForm({ price: pkg.price, users_limit: pkg.users_limit, duration: pkg.duration, course_ids: pkg.courses?.map(c => c.id) ?? [] }); setEditing(true) }} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
          <button onClick={deletePkg} disabled={busy} className="text-destructive/60 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>Users: <span className="font-medium text-foreground">{pkg.users_limit}</span></span>
        <span>Duration: <span className="font-medium text-foreground">{pkg.duration} days</span></span>
      </div>
      {pkg.courses && pkg.courses.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pkg.courses.map(c => (
            <span key={c.id} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{c.name} ({c.questions_count}Q)</span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   User Package Card
   ═══════════════════════════════════════════ */
function UserPackageCard({ pkg, isSelected, onSelect }: { pkg: DBPackage; isSelected: boolean; onSelect: () => void }) {
  const title = getPackageTitle(pkg.users_limit, pkg.courses?.length ?? 0)
  const totalQuestions = pkg.courses?.reduce((sum, c) => sum + Number(c.questions_count), 0) ?? 0
  const features = [
    "Subscribe for the end of the course",
    `View all ${totalQuestions.toLocaleString()} questions.`,
    "Clear explanations.",
    "Watch from anywhere.",
    "Timed tests and tutor-led exams.",
  ]
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border-2 transition-all ${isSelected ? "border-secondary shadow-lg" : "border-border shadow-sm"}`}>
      <div className={`flex flex-col items-center gap-2 px-5 py-6 ${isSelected ? "bg-secondary/5" : "bg-background"}`}>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${pkg.users_limit > 1 ? "bg-primary/10" : "bg-secondary/10"}`}>
          {pkg.users_limit > 1 ? <Users className="h-6 w-6 text-primary" /> : <BookOpen className="h-6 w-6 text-secondary" />}
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-3xl font-bold text-foreground">{pkg.price} <span className="text-sm font-normal text-muted-foreground">JOD</span></p>
        <p className="text-xs text-muted-foreground">{pkg.users_limit} user{pkg.users_limit > 1 ? "s" : ""}</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 bg-muted/30 px-5 py-4">
        {features.map(f => (
          <div key={f} className="flex items-start gap-2 text-sm text-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <span>{f}</span>
          </div>
        ))}
        {pkg.courses && pkg.courses.length > 1 && (
          <div className="mt-3 border-t border-border pt-3">
            <h6 className="text-sm font-medium text-foreground mb-1.5">
              Courses Included:
            </h6>
            <ol className="flex flex-col list-decimal gap-1 pl-5 text-sm text-foreground">
                {pkg.courses.map(c=> (
                  <li key={c.id || c.name}>{c.name}</li>
                ))}
            </ol>
          </div>
        )}
      </div>
      <div className="border-t border-border bg-background px-5 py-3">
        <Button onClick={onSelect} className={`w-full ${isSelected ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
          {isSelected ? "Selected" : "Select Package"}
        </Button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */
export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { user, isAdmin } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [addingSubject, setAddingSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState("")
  const [addingPackage, setAddingPackage] = useState(false)
  const [subjectBusy, setSubjectBusy] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null)

  // Mass Deactivation State
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const subjectsUrl = editMode ? `/api/courses/${slug}/subjects?all=true` : `/api/courses/${slug}/subjects`
  const packagesUrl = editMode ? `/api/courses/${slug}/packages?all=true` : `/api/courses/${slug}/packages`

  const { data: course, isLoading: courseLoading } = useSWR<DBCourse>(`/api/courses/${slug}`)
  const { data: subjects, isLoading: subjectsLoading } = useSWR<DBSubject[]>(subjectsUrl)
  const { data: packages } = useSWR<DBPackage[]>(packagesUrl)
  const { data: allCourses } = useSWR<AllCourse[]>(editMode ? "/api/courses/all" : null)
  const { data: subCheck } = useSWR<{ subscribed: boolean }>(
    user && !isAdmin ? `/api/subscriptions/check?user_id=${user.id}&course_id=${slug}` : null
  )
  const isSubscribed = isAdmin || subCheck?.subscribed === true

  const addSubject = useCallback(async () => {
    if (!newSubjectName.trim()) return
    setSubjectBusy(true)
    await fetch(`/api/courses/${slug}/subjects`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newSubjectName.trim() }) })
    await globalMutate(`/api/courses/${slug}/subjects?all=true`)
    setNewSubjectName(""); setAddingSubject(false); setSubjectBusy(false)
  }, [newSubjectName, slug])

  const handleDeactivateAll = async () => {
    setDeactivating(true)
    try {
      const res = await fetch(`/api/admin/subscriptions/course/${slug}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate subscriptions')
      alert(data.message || 'Subscriptions deactivated.')
      setShowDeactivateModal(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeactivating(false)
    }
  }

  if (courseLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div>
  }
  if (!course) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Course not found</h2>
          <p className="mt-2 text-muted-foreground">The course &quot;{slug}&quot; could not be found.</p>
          <Link href="/" className="mt-4 inline-block text-secondary hover:underline">Back to Home</Link>
        </div>
      </div>
    )
  }

  const totalSubjects = Number(course.total_subjects) || 0
  const totalQuestions = Number(course.total_questions) || 0
  const statCards = [
    { icon: BookOpen, value: totalSubjects, label: "Subjects", desc: "Questions are divided each into its subject." },
    { icon: FileQuestion, value: totalQuestions, label: "Questions", desc: "The total No. of questions related to this course." },
    { icon: FileText, value: null, label: "Explanations", desc: "Step-by-step explanation included with each question." },
    { icon: Timer, value: null, label: "Timed Tests", desc: "Mock exams with timed questions simulation." },
    { icon: Users, value: null, label: "All Time", desc: "All time subscriptions." },
    { icon: UserCheck, value: null, label: "Active", desc: "Currently subscribed users." },
  ]

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="bg-muted/50 px-4 py-3" aria-label="Breadcrumb">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><Home className="h-3.5 w-3.5" /> Home</Link>
          <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">{course.name}</span>
        </div>
      </nav>

      {/* Edit mode banner */}
      {editMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-start sm:items-center justify-between gap-y-2">
            <span className="text-sm font-medium text-amber-800">Editing Mode is enabled. Changes are saved per section.</span>
            <div className="flex flex-wrap items-center gap-3">
              {user && !BLOCKED_ADMIN_IDS.includes(user.id) && (
                <Button variant="destructive" size="sm" onClick={() => setShowDeactivateModal(true)}>
                  Deactivate All Subscriptions
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)} className="border-amber-300 text-amber-800 hover:bg-amber-100">
                <X className="mr-1 h-3.5 w-3.5" /> Exit Editing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative flex min-h-[280px] items-center justify-center overflow-hidden">
        {course.hero_image ? (
          <><img src={course.hero_image} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-primary/70" /></>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        )}
        <div className="relative z-10 px-4 py-16 text-center">
          <h1 className="text-balance text-3xl font-bold text-white md:text-4xl">{course.name}</h1>
          {!course.is_active && <span className="mt-2 inline-block rounded bg-red-500/80 px-3 py-1 text-xs font-medium text-white">Inactive</span>}
          {isAdmin && !editMode && (
            <div className="mt-4"><Button onClick={() => setEditMode(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90"><Edit3 className="mr-2 h-4 w-4" /> Enable Editing Mode</Button></div>
          )}
        </div>
      </section>

      {/* Course Info Editing */}
      {editMode && (
        <section className="bg-background py-8"><div className="mx-auto max-w-3xl px-4"><h2 className="mb-6 text-xl font-bold text-foreground">Edit Course Info</h2><CourseEditForm course={course} slug={slug} onDone={() => setEditMode(false)} /></div></section>
      )}

      {/* CTA */}
      {!editMode && (
        <section className="bg-background py-6">
          <div className="mx-auto flex max-w-xl flex-col gap-3 px-4">
            {isSubscribed ? (
              /* Subscribed user: direct access only */
              <Link href={`/course/${slug}/session-dashboard`}>
                <Button className="w-full bg-secondary py-6 text-base font-semibold text-secondary-foreground hover:bg-secondary/90">Go to Course</Button>
              </Link>
            ) : (
              /* Not subscribed: show subscribe + try free */
              <>
                <Link href={`/course/${slug}/payment`}>
                  <Button className="w-full bg-secondary py-6 text-base font-semibold text-secondary-foreground hover:bg-secondary/90">Subscribe Now</Button>
                </Link>
                <Link href={`/course/${slug}/session-dashboard`}>
                  <Button variant="outline" className="w-full py-6 text-base font-semibold">Go to Course</Button>
                </Link>
                <p className="text-center text-sm text-muted-foreground">
                  <Link href={`/course/${slug}/preview`} className="text-secondary underline hover:text-secondary/80">Try for Free</Link>{" - start a session with 5 sample questions."}
                </p>
              </>
            )}
          </div>
        </section>
      )}

      {/* About */}
      {!editMode && (
        <section className="bg-muted/30 py-10"><div className="mx-auto max-w-7xl px-4"><h2 className="mb-4 text-2xl font-bold text-foreground">About</h2><p className="max-w-3xl leading-relaxed text-muted-foreground">{course.about || course.description || "No description available."}</p></div></section>
      )}

      {/* Stats */}
      <section className="bg-background py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {statCards.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background p-5 text-center shadow-sm">
                {stat.value !== null ? <span className="text-3xl font-bold text-primary">{stat.value}</span> : <stat.icon className="h-8 w-8 text-secondary" />}
                {stat.label && <span className="text-xs font-semibold text-foreground">{stat.label}</span>}
                <p className="text-xs leading-snug text-muted-foreground">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="bg-background py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                <div className="flex items-center justify-between bg-primary px-4 py-3">
                  <h3 className="text-base font-bold text-primary-foreground">{"Course's Subjects"}</h3>
                  {editMode && <button onClick={() => setAddingSubject(true)} className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/90"><Plus className="h-3.5 w-3.5" /> Add Subject</button>}
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  {addingSubject && (
                    <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
                      <input className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm text-foreground" placeholder="New subject name..." value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} onKeyDown={e => e.key === "Enter" && addSubject()} autoFocus />
                      <button onClick={addSubject} disabled={subjectBusy} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                      <button onClick={() => { setAddingSubject(false); setNewSubjectName("") }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                  )}
                  {subjectsLoading ? (
                    <div className="flex items-center justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : subjects && subjects.length > 0 ? (
                    subjects.map((s, idx) => editMode ? <EditableSubjectRow key={s.id} subject={s} index={idx} slug={slug} /> : <SubjectRow key={s.id} subject={s} index={idx} />)
                  ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground">No subjects found for this course.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h3 className="mb-3 text-lg font-bold text-foreground">Subjects</h3>
              <p className="leading-relaxed text-sm text-muted-foreground">To ensure a structured and efficient study experience, each course is divided into subjects. This classification allows for better organization of the question bank and enables users to focus on specific areas of the curriculum.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Packages */}
      {(editMode || (packages && packages.length > 0)) && (
        <section className="bg-muted/30 py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Subscription Packages</h2>
              {editMode && <Button size="sm" onClick={() => setAddingPackage(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90"><Plus className="mr-1 h-4 w-4" /> Add Package</Button>}
            </div>

            {editMode ? (
              /* ── Admin package editor cards ── */
              <div className="flex flex-col gap-4">
                {addingPackage && <AdminPackageRow pkg={null} slug={slug} allCourses={allCourses || []} isNew onCancelNew={() => setAddingPackage(false)} />}
                {packages?.map(pkg => <AdminPackageRow key={pkg.id} pkg={pkg} slug={slug} allCourses={allCourses || []} />)}
                {(!packages || packages.length === 0) && !addingPackage && <p className="py-8 text-center text-sm text-muted-foreground">No packages yet. Click "Add Package" to create one.</p>}
              </div>
            ) : (
              /* ── User-facing package cards ── */
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages?.map(pkg => (
                  <UserPackageCard key={pkg.id} pkg={pkg} isSelected={selectedPkg === pkg.id} onSelect={() => setSelectedPkg(pkg.id)} />
                ))}
              </div>
            )}

            {/* User: continue to checkout */}
            {!editMode && selectedPkg && (
              <div className="mt-6 text-center">
                <Link href={`/course/${slug}/payment?pkg=${selectedPkg}`}>
                  <Button className="bg-primary px-8 py-5 text-base font-semibold text-primary-foreground hover:bg-primary/90">Continue to Checkout</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Deactivate All Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDeactivateModal(false)}>
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-2 text-xl font-bold text-destructive">Deactivate All Subscriptions</h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to deactivate all active subscriptions for this course? Protected admin users will not be affected. <strong>This action cannot be undone.</strong>
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeactivateModal(false)} disabled={deactivating}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeactivateAll} disabled={deactivating}>
                {deactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Deactivate All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
