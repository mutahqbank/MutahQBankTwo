"use client"

import { use, useState } from "react"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import { 
  Loader2, Plus, Edit, Trash2, Home, ChevronRightIcon,
  ToggleLeft, ToggleRight, Check, X, ArrowLeft, Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Option { id?: number; option: string; correct: boolean; selection_count?: number }
interface Figure { id?: number; image_url: string; public_id?: string; figure_type?: string | number; uploading?: boolean; file?: File; preview_url?: string }
interface SubQuestion { id?: number; subquestion_text: string; answer_html: string }

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
  options: Option[]
  figures: Figure[]
  sub_questions: SubQuestion[]
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
    period_id: 1 as number | null, // 1: Mid, 2: Final
    options: [] as Option[],
    figures: [] as Figure[],
    explanation_figures: [] as Figure[],
    sub_questions: [] as SubQuestion[]
  })
  const [saving, setSaving] = useState(false)

  const subjectName = questions?.[0]?.subject_name || "Subject"

  const handleAddNew = () => {
    setForm({ question: "", explanation: "", active: true, type_id: 1, period_id: 1, options: [], figures: [], explanation_figures: [], sub_questions: [] })
    setEditingId("new")
  }

  const handleEdit = (q: AdminQuestion) => {
    const allFigures = q.figures || []
    const questionFigures = allFigures.filter((f: any) => !f.type_id || f.type_id === 1)
    const explanationFigures = allFigures.filter((f: any) => f.type_id === 2)
    setForm({
      question: q.question_text || "",
      explanation: q.explanation_html || "",
      active: q.active,
      type_id: q.type_id || 1,
      period_id: q.period_id || 1,
      options: q.options || [],
      figures: questionFigures,
      explanation_figures: explanationFigures,
      sub_questions: q.sub_questions || []
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
      // Upload any pending files to Cloudinary first
      const uploadFigure = async (fig: any) => {
        if (fig.file) {
          const formData = new FormData()
          formData.append("file", fig.file)
          const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || "Failed to upload image")
          return { ...fig, image_url: data.secure_url, public_id: data.public_id, file: undefined, preview_url: undefined }
        }
        return { ...fig, file: undefined, preview_url: undefined }
      }

      const uploadedQuestionFigs = await Promise.all(form.figures.map(uploadFigure))
      const uploadedExplanationFigs = await Promise.all(form.explanation_figures.map(uploadFigure))

      // Merge question figures (type_id=1) and explanation figures (type_id=2) into one array
      const mergedFigures = [
        ...uploadedQuestionFigs.map((f: any) => ({ ...f, figure_type: 1, type_id: 1 })),
        ...uploadedExplanationFigs.map((f: any) => ({ ...f, figure_type: 2, type_id: 2 }))
      ]
      const payload = { ...form, figures: mergedFigures }
      delete (payload as any).explanation_figures

      if (editingId === "new") {
        const res = await fetch(`/api/admin/subjects/${subjectId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error("Failed to create question")
      } else {
        const res = await fetch(`/api/admin/questions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
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

        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : questions && questions.length > 0 ? (
            <div className="divide-y divide-border">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 hover:bg-muted/30 transition-colors">
                  <div className={`flex flex-col gap-3 ${!q.active ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
                          {idx + 1}
                        </span>
                        <div className="flex-1 space-y-2">
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

                            {q.options?.length > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted-foreground/20 text-muted-foreground">{q.options.length} Options</span>}
                            {q.figures?.length > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted-foreground/20 text-muted-foreground">{q.figures.length} Figures</span>}
                            {q.sub_questions?.length > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted-foreground/20 text-muted-foreground">{q.sub_questions.length} Sub-questions</span>}
                          </div>
                        </div>
                      </div>

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

          {editingId !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6" onClick={() => setEditingId(null)}>
              <div 
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-background shadow-2xl ring-1 ring-border" 
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

function QuestionForm({ form, setForm, onSave, onCancel, saving, isNew }: any) {

  const addOption = () => {
    setForm({ ...form, options: [...form.options, { option: "", correct: false }] })
  }
  const removeOption = (idx: number) => {
    setForm({ ...form, options: form.options.filter((_: any, i: number) => i !== idx) })
  }
  const updateOption = (idx: number, field: string, value: any) => {
    const newOptions = [...form.options]
    if (field === 'correct' && value === true) {
      newOptions.forEach(o => o.correct = false) // Single correct answer for MCQ
    }
    newOptions[idx] = { ...newOptions[idx], [field]: value }
    setForm({ ...form, options: newOptions })
  }

  // Generic figure helpers that work for both 'figures' and 'explanation_figures'
  const addFigureToKey = (key: 'figures' | 'explanation_figures', typeId: number) => {
    setForm({ ...form, [key]: [...form[key], { image_url: "", figure_type: typeId, uploading: false }] })
  }
  const removeFigureFromKey = (key: 'figures' | 'explanation_figures', idx: number) => {
    // Revoke blob URL if present to avoid memory leaks
    const fig = form[key][idx]
    if (fig.preview_url) URL.revokeObjectURL(fig.preview_url)
    setForm({ ...form, [key]: form[key].filter((_: any, i: number) => i !== idx) })
  }
  
  // Store file locally with a blob preview — upload happens on Save
  const handleFileSelect = (key: 'figures' | 'explanation_figures', idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 15 * 1024 * 1024) {
      alert("File is too large. Maximum size is 15MB.")
      return
    }

    const previewUrl = URL.createObjectURL(file)
    const newFigures = [...form[key]]
    newFigures[idx] = { ...newFigures[idx], file, preview_url: previewUrl, image_url: "" }
    setForm({ ...form, [key]: newFigures })
  }

  const addSubQuestion = () => {
    setForm({ ...form, sub_questions: [...form.sub_questions, { subquestion_text: "", answer_html: "" }] })
  }
  const removeSubQuestion = (idx: number) => {
    setForm({ ...form, sub_questions: form.sub_questions.filter((_: any, i: number) => i !== idx) })
  }
  const updateSubQuestion = (idx: number, field: string, value: any) => {
    const newSubs = [...form.sub_questions]
    newSubs[idx] = { ...newSubs[idx], [field]: value }
    setForm({ ...form, sub_questions: newSubs })
  }

  // Reusable figure section renderer
  const renderFigureSection = (key: 'figures' | 'explanation_figures', label: string, typeId: number, borderColor: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground">{label}</h4>
        <Button type="button" variant="outline" size="sm" onClick={() => addFigureToKey(key, typeId)} className="h-6 px-2 text-[10px] bg-background">
          <Plus className="mr-1 h-3 w-3" /> Add
        </Button>
      </div>
      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
        {form[key].map((fig: any, idx: number) => (
          <div key={idx} className="relative rounded-md border border-border bg-background p-2 shadow-sm">
            <button 
              type="button" onClick={() => removeFigureFromKey(key, idx)} 
              className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-destructive hover:bg-destructive hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
            
            {fig.uploading ? (
              <div className="flex flex-col items-center justify-center py-4 h-20 bg-muted/20 border-2 border-dashed border-border rounded">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground font-medium">Uploading...</span>
              </div>
            ) : (fig.image_url || fig.preview_url) ? (
              <div className="relative group">
                <img src={fig.preview_url || fig.image_url} alt={label} className="h-20 w-full rounded object-contain bg-muted/50 border border-border" />
                {fig.preview_url && <span className="absolute top-1 left-1 text-[8px] bg-amber-500 text-white px-1 rounded font-bold">Pending upload</span>}
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer">
                  <span className="text-white text-[10px] font-semibold">Change Image</span>
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={(e) => handleFileSelect(key, idx, e)}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-3 bg-muted/10 border-2 border-dashed border-border rounded hover:bg-muted/30 transition-colors">
                <label className="flex flex-col items-center cursor-pointer w-full h-full">
                  <ImageIcon className="h-5 w-5 text-muted-foreground/60 mb-1" />
                  <span className="text-[10px] font-medium text-secondary hover:text-secondary/80">Click to upload</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">JPG, PNG, WEBP (Max 15MB)</span>
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={(e) => handleFileSelect(key, idx, e)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        ))}
        {form[key].length === 0 && (
          <div className="py-3 text-center border-2 border-dashed border-border rounded-lg">
            <ImageIcon className="mx-auto h-5 w-5 text-muted-foreground/40 mb-1" />
            <p className="text-[10px] text-muted-foreground">No images</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.active} 
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded border-border accent-primary"
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
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:ring-secondary focus:border-secondary"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Explanation (Raw HTML / Text)</label>
            <textarea 
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:ring-secondary focus:border-secondary"
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            />
          </div>
        </div>

        {/* Figures Manager (Right Column) */}
        <div className="space-y-5 rounded-xl border border-border bg-muted/20 p-4">
          {renderFigureSection('figures', '📷 Question Images', 1, 'blue')}
          <hr className="border-border" />
          {renderFigureSection('explanation_figures', '📝 Explanation Images', 2, 'amber')}
        </div>
      </div>

      <hr className="border-border" />

      {/* MCQs Option Manager */}
      {form.type_id === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-foreground">MCQ Options</h4>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="mr-2 h-4 w-4" /> Add Option
            </Button>
          </div>
          <div className="grid gap-3">
            {form.options.map((opt: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border border-border bg-background p-2 pr-3">
                <div className="flex flex-col items-center justify-center pl-2 pt-1 border-r border-border pr-3">
                  <input 
                    type="checkbox" 
                    checked={opt.correct} 
                    onChange={(e) => updateOption(idx, 'correct', e.target.checked)}
                    className="h-5 w-5 rounded-sm border-border accent-green-600 cursor-pointer"
                    title="Mark as correct answer"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Correct</span>
                </div>
                <textarea
                  rows={2}
                  value={opt.option}
                  placeholder={`Option ${idx + 1}...`}
                  onChange={(e) => updateOption(idx, 'option', e.target.value)}
                  className="flex-1 font-mono text-sm resize-none rounded-md border-transparent bg-muted/20 px-3 py-2 focus:border-border focus:bg-background focus:ring-secondary"
                />
                <button type="button" onClick={() => removeOption(idx)} className="text-destructive/60 hover:text-destructive p-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {form.options.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-4">Add options for this multiple choice question.</p>
            )}
          </div>
        </div>
      )}

      {/* CBQ Sub-questions Manager */}
      {form.type_id === 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-foreground">Sub-Questions</h4>
            <Button type="button" variant="outline" size="sm" onClick={addSubQuestion}>
              <Plus className="mr-2 h-4 w-4" /> Add Sub-Question
            </Button>
          </div>
          <div className="grid gap-3">
            {form.sub_questions.map((sq: any, idx: number) => (
              <div key={idx} className="flex gap-3 rounded-lg border border-border bg-background p-4 relative">
                <button type="button" onClick={() => removeSubQuestion(idx)} className="absolute right-3 top-3 text-destructive/60 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-3 pr-6">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Sub-question text</label>
                    <textarea
                      rows={2}
                      value={sq.subquestion_text}
                      onChange={(e) => updateSubQuestion(idx, 'subquestion_text', e.target.value)}
                      className="w-full font-mono text-sm mt-1 rounded-md border border-border px-3 py-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Answer / Explanation HTML</label>
                    <textarea
                      rows={2}
                      value={sq.answer_html}
                      onChange={(e) => updateSubQuestion(idx, 'answer_html', e.target.value)}
                      className="w-full font-mono text-sm mt-1 rounded-md border border-border px-3 py-2 focus:ring-secondary"
                    />
                  </div>
                </div>
              </div>
            ))}
            {form.sub_questions.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-4">Add sub-questions for this case based scenario.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-border mt-6">
        <Button onClick={onSave} disabled={saving} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 flex-1 sm:flex-none">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          {isNew ? "Create Full Question" : "Save Changes"}
        </Button>
        <Button onClick={onCancel} disabled={saving} variant="outline" className="flex-1 sm:flex-none">
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
      </div>
    </div>
  )
}
