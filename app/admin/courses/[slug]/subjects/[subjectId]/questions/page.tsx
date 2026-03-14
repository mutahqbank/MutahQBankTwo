"use client"

import { use, useState } from "react"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import { 
  Loader2, Plus, Edit, Trash2, Home, ChevronRightIcon,
  ToggleLeft, ToggleRight, Check, X, ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Type matches the GET response from the API we created
interface AdminQuestion {
  id: number
  question_text: string
  explanation_html: string
  subject_id: number
  type_id: number
  active: boolean
  period_id: number | null
  subject_name: string
  question_type: string
  exam_period: string
}

export default function AdminSubjectQuestionsPage({ params }: { params: Promise<{ slug: string, subjectId: string }> }) {
  const { slug, subjectId } = use(params)
  
  const { data: questions, isLoading } = useSWR<AdminQuestion[]>(`/api/admin/subjects/${subjectId}/questions`)
  
  const [editingId, setEditingId] = useState<number | "new" | null>(null)
  const [form, setForm] = useState({
    question: "",
    explanation: "",
    active: true,
    type_id: 1, // 1: MCQ, 2: Case Based
    period_id: 1 as number | null // 1: Mid, 2: Final
  })
  const [saving, setSaving] = useState(false)

  const subjectName = questions?.[0]?.subject_name || "Subject"

  const handleAddNew = () => {
    setForm({ question: "", explanation: "", active: true, type_id: 1, period_id: 1 })
    setEditingId("new")
  }

  const handleEdit = (q: AdminQuestion) => {
    setForm({
      question: q.question_text || "",
      explanation: q.explanation_html || "",
      active: q.active,
      type_id: q.type_id || 1,
      period_id: q.period_id || 1
    })
    setEditingId(q.id)
  }

  const handleSave = async () => {
    if (!form.question.trim()) {
      alert("Question text is required.")
      return
    }

    setSaving(true)
    try {
      if (editingId === "new") {
        const res = await fetch(`/api/admin/subjects/${subjectId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        })
        if (!res.ok) throw new Error("Failed to create question")
      } else {
        const res = await fetch(`/api/admin/questions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        })
        if (!res.ok) throw new Error("Failed to update question")
      }
      
      await mutate(`/api/admin/subjects/${subjectId}/questions`)
      setEditingId(null)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this question? This may delete related options and figures.")) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete question")
      
      await mutate(`/api/admin/subjects/${subjectId}/questions`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  // Quick toggle without opening edit form
  const toggleActive = async (q: AdminQuestion) => {
    try {
      await fetch(`/api/admin/questions/${q.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !q.active })
      })
      mutate(`/api/admin/subjects/${subjectId}/questions`)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Breadcrumb Navigation */}
      <nav className="bg-background border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4" /> Home
          </Link>
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          <Link href={`/course/${slug}`} className="text-muted-foreground hover:text-foreground">
            Course
          </Link>
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">Manage Questions</span>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link href={`/course/${slug}`}>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">
                {isLoading ? "Loading..." : `${subjectName} - Questions`}
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground ml-11">
              Admin management interface for subject questions.
            </p>
          </div>
          <Button onClick={handleAddNew} disabled={editingId !== null} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </div>

        {/* Existing Questions List */}
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : questions && questions.length > 0 ? (
            <div className="divide-y divide-border">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 hover:bg-muted/30 transition-colors">
                  {/* Question Display */}
                  <div className={`flex flex-col gap-3 ${!q.active ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
                          {idx + 1}
                        </span>
                        <div className="flex-1 space-y-2">
                          {/* Raw text display as requested */}
                          <div className="text-sm font-medium text-foreground whitespace-pre-wrap font-mono bg-muted/50 p-3 rounded-md border border-border/50">
                            {q.question_text || "No question text"}
                          </div>
                          
                          {q.explanation_html && (
                            <div className="text-xs text-muted-foreground border-l-2 border-secondary pl-3 mt-2">
                              <span className="font-semibold block mb-1">Explanation:</span>
                              <span className="font-mono whitespace-pre-wrap">{q.explanation_html}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 pt-1">
                            {q.type_id === 1 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">MCQ</span>}
                            {q.type_id === 2 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">Case Based</span>}
                            {q.period_id === 1 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Mid</span>}
                            {q.period_id === 2 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Final</span>}
                            {!q.active && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Inactive</span>}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleActive(q)} className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted" title="Toggle Active">
                          {q.active ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button onClick={() => handleEdit(q)} disabled={editingId !== null} className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(q.id)} disabled={editingId !== null} className="p-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-md" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-muted-foreground mb-4">No questions found for this subject.</p>
              {editingId !== "new" && (
                <Button onClick={handleAddNew} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add First Question
                </Button>
              )}
            </div>
          )}

          {/* Modal Overlay for Add/Edit */}
          {editingId !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6" onClick={() => setEditingId(null)}>
              <div 
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-background shadow-2xl ring-1 ring-border" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-background z-10">
                  <h3 className="text-lg font-bold text-foreground">
                    {editingId === "new" ? "Add New Question" : "Edit Question"}
                  </h3>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  <QuestionForm 
                    form={form} setForm={setForm}
                    onSave={handleSave} onCancel={() => setEditingId(null)}
                    saving={saving} isNew={editingId === "new"}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Reusable form component for both New and Edit states
function QuestionForm({ form, setForm, onSave, onCancel, saving, isNew }: any) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 mb-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input 
            type="checkbox" 
            checked={form.active} 
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="rounded border-border"
          />
          <span className="font-medium text-foreground">Active</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Question Type</label>
          <select 
            value={form.type_id} 
            onChange={(e) => setForm({ ...form, type_id: parseInt(e.target.value) })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-secondary focus:border-secondary"
          >
            <option value={1}>Multiple Choice (MCQ)</option>
            <option value={2}>Case Based Question (CBQ)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Period</label>
          <select 
            value={form.period_id || 1} 
            onChange={(e) => setForm({ ...form, period_id: parseInt(e.target.value) })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-secondary focus:border-secondary"
          >
            <option value={1}>Mid</option>
            <option value={2}>Final</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Question Content (Raw HTML / Text)</label>
        <textarea 
          rows={5}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:ring-secondary focus:border-secondary"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          placeholder="<p>Question text...</p>"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Explanation (Raw HTML / Text)</label>
        <textarea 
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:ring-secondary focus:border-secondary"
          value={form.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          placeholder="<p>Detailed explanation...</p>"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={onSave} disabled={saving} size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          {isNew ? "Create Question" : "Save Changes"}
        </Button>
        <Button onClick={onCancel} disabled={saving} variant="outline" size="sm">
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
      </div>
    </div>
  )
}
