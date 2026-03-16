"use client"

import { use, useState } from "react"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import { 
  Loader2, Plus, Edit, Trash2, Home, ChevronRightIcon,
  ToggleLeft, ToggleRight, Check, X, ArrowLeft, Image as ImageIcon,
  ChevronDown, ChevronUp, BookOpen, Bold, Italic, Underline, 
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Code,
  Type, MessageSquare, Database
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [rawText, setRawText] = useState("")

  const handleRawImport = async () => {
    if (!rawText.trim()) return

    setSaving(true)
    let successCount = 0
    let failCount = 0

    try {
      if (form.type_id === 1) {
        // MCQ Parsing - Split by Q) at start of line
        const blocks = rawText.split(/(?:\n|^)Q\)/i).filter(b => b.trim())
        
        for (const block of blocks) {
          // Re-add Q) prefix for internal regex matching consistency if needed, 
          // but we can just match from start of block
          const questionMatch = block.match(/^\s*([\s\S]*?)\s*(?=\n\s*O\)|\n\s*C\)|\n\s*E\)|$)/i)
          const question = questionMatch ? questionMatch[1].trim() : ""
          if (!question) continue

          const optionMatches = [...block.matchAll(/(?:\n|^)\s*O\)\s*([\s\S]*?)\s*(?=\n\s*O\)|\n\s*C\)|\n\s*E\)|$)/gi)]
          const options = optionMatches.map(m => ({
            option: m[1].trim(),
            correct: false
          }))

          const correctMatch = block.match(/(?:\n|^)\s*C\)\s*(\d+)/i)
          if (correctMatch) {
            const idx = parseInt(correctMatch[1]) - 1
            if (options[idx]) options[idx].correct = true
          }

          const explanationMatch = block.match(/(?:\n|^)\s*E\)\s*([\s\S]*)$/i)
          const explanation = explanationMatch ? explanationMatch[1].trim() : ""

          const payload = {
            ...form,
            question,
            explanation,
            options,
            figures: [] // Raw import doesn't handle figures yet
          }

          const res = await fetch(`/api/admin/subjects/${subjectId}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
          
          if (res.ok) successCount++
          else failCount++
        }
      } else {
        // Case Based Parsing - Split by C) at start of line
        const blocks = rawText.split(/(?:\n|^)C\)/i).filter(b => b.trim())
        
        for (const block of blocks) {
          const caseMatch = block.match(/^\s*([\s\S]*?)\s*(?=\n\s*Q\)|$)/i)
          const caseText = caseMatch ? caseMatch[1].trim() : ""
          if (!caseText) continue

          const qMatches = [...block.matchAll(/(?:\n|^)\s*Q\)\s*([\s\S]*?)\s*(?:\n\s*A\)\s*([\s\S]*?))\s*(?=\n\s*Q\)|\n\s*E\)|$)/gi)]
          const sub_questions = qMatches.map(m => ({
            subquestion_text: m[1].trim(),
            answer_html: m[2].trim()
          }))

          const explanationMatch = block.match(/(?:\n|^)\s*E\)\s*([\s\S]*)$/i)
          const explanation = explanationMatch ? explanationMatch[1].trim() : ""

          const payload = {
            ...form,
            question: caseText,
            explanation,
            sub_questions,
            figures: []
          }

          const res = await fetch(`/api/admin/subjects/${subjectId}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })

          if (res.ok) successCount++
          else failCount++
        }
      }

      if (successCount > 0) {
        await mutate(`/api/admin/subjects/${subjectId}/questions`)
        alert(`Successfully imported ${successCount} questions.${failCount > 0 ? ` Failed to import ${failCount} items.` : ''}`)
        setEditingId(null)
        setRawText("")
      } else {
        alert("Failed to import any questions. Please check the format.")
      }
    } catch (err) {
      console.error("Batch Import error:", err)
      alert("An unexpected error occurred during batch import.")
    } finally {
      setSaving(false)
    }
  }

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

  // Generic figure helpers
  const addFigureToKey = (key: 'figures' | 'explanation_figures', typeId: number) => {
    setForm({ ...form, [key]: [...form[key], { image_url: "", figure_type: typeId, uploading: false }] })
  }
  const removeFigureFromKey = (key: 'figures' | 'explanation_figures', idx: number) => {
    const fig = form[key][idx]
    if (fig.preview_url) URL.revokeObjectURL(fig.preview_url)
    setForm({ ...form, [key]: form[key].filter((_: any, i: number) => i !== idx) })
  }
  
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

  const renderToolbar = (field: string) => (
    <div className="flex items-center gap-1 p-2 bg-muted/40 border-b border-border">
      <div className="flex items-center gap-0.5 border-r border-border/50 pr-1 mr-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md"><Bold className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md"><Italic className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md"><Underline className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="flex items-center gap-0.5 border-r border-border/50 pr-1 mr-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md"><List className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md"><ListOrdered className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md"><AlignLeft className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md"><AlignCenter className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  )

  const renderFigureSection = (key: 'figures' | 'explanation_figures', label: string, typeId: number, borderColor: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</h4>
        <Button type="button" variant="outline" size="sm" onClick={() => addFigureToKey(key, typeId)} className="h-6 px-2 text-[9px] font-black uppercase tracking-widest bg-background">
          <Plus className="mr-1 h-3 w-3" /> Add Image
        </Button>
      </div>
      <div className="space-y-3 max-h-[220px] overflow-y-auto scrollbar-thin">
        {form[key].map((fig: any, idx: number) => (
          <div key={idx} className="relative rounded-xl border border-border bg-background p-2 group/img">
            <button 
              type="button" onClick={() => removeFigureFromKey(key, idx)} 
              className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-destructive shadow-sm scale-0 group-hover/img:scale-100 transition-all hover:bg-destructive hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
            
            {(fig.image_url || fig.preview_url) ? (
              <div className="relative aspect-video">
                <img src={fig.preview_url || fig.image_url} alt={label} className="h-full w-full rounded-lg object-contain bg-muted/30" />
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg cursor-pointer">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">Change</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileSelect(key, idx, e)} className="hidden" />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-video bg-muted/10 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/20 transition-all">
                <ImageIcon className="h-5 w-5 text-muted-foreground/40 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Upload Image</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect(key, idx, e)} className="hidden" />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  )

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
      <nav className="bg-background border-b border-border px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4" /> Home
          </Link>
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          <Link href={`/course/${slug}`} className="text-muted-foreground hover:text-foreground italic">
            Course
          </Link>
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">Questions Management</span>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Link href={`/course/${slug}`}>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                {isLoading ? "Loading..." : `${subjectName}`}
                <span className="text-slate-300 font-light mx-2">|</span>
                <span className="text-xl font-bold text-muted-foreground">Questions</span>
              </h1>
            </div>
            <p className="text-sm font-medium text-muted-foreground ml-14">
              Admin management interface for subject questions.
            </p>
          </div>
          <Button onClick={handleAddNew} disabled={editingId !== null} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 px-6 rounded-xl shadow-lg shadow-secondary/20 font-bold transition-all hover:-translate-y-0.5">
            <Plus className="mr-2 h-5 w-5" /> Add Question
          </Button>
        </div>

        <div className="space-y-8">
          {isLoading ? (
            <div className="flex justify-center p-20 bg-background rounded-2xl border border-border shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-secondary" />
            </div>
          ) : questions && questions.length > 0 ? (
            <div className="grid gap-8">
              {questions.map((q, idx) => (
                <QuestionCard 
                  key={q.id} 
                  q={q} 
                  idx={idx} 
                  handleEdit={handleEdit} 
                  handleDelete={handleDelete} 
                  toggleActive={toggleActive} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-muted-foreground mb-4">No questions found for this subject.</p>
              <Button onClick={handleAddNew} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add First Question
              </Button>
            </div>
          )}
        </div>

        {/* Mass Import Dialog (Screen 1) */}
        <Dialog open={editingId === "new"} onOpenChange={(open) => !open && setEditingId(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl h-[90vh] flex flex-col">
            <div className="bg-background flex flex-col min-h-0 h-full">
              <div className="flex items-center justify-between border-b border-border px-8 py-5 shrink-0">
                <DialogTitle className="text-xl font-bold text-foreground">Add New Question</DialogTitle>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-8">
                <div className="space-y-8">
                  <div className="flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={form.active} 
                          onChange={(e) => setForm({ ...form, active: e.target.checked })}
                          className="h-5 w-5 rounded border-border accent-secondary cursor-pointer"
                        />
                        <span className="font-bold text-foreground group-hover:text-secondary transition-colors text-base">Active</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="space-y-1.5 min-w-[200px]">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Question Type</label>
                        <select 
                          value={form.type_id} 
                          onChange={(e) => setForm({ ...form, type_id: parseInt(e.target.value) })}
                          className="w-full h-11 rounded-xl border border-border bg-muted/5 px-4 py-2 text-sm font-bold text-foreground focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                        >
                          <option value={1}>Multiple Choice (MCQ)</option>
                          <option value={2}>Case Based Question (CBQ)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 min-w-[200px]">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Period</label>
                        <select 
                          value={form.period_id || 1} 
                          onChange={(e) => setForm({ ...form, period_id: parseInt(e.target.value) })}
                          className="w-full h-11 rounded-xl border border-border bg-muted/5 px-4 py-2 text-sm font-bold text-foreground focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                        >
                          <option value={1}>Mid</option>
                          <option value={2}>Final</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Raw Import Data</label>
                      <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">Format: Q)... O)... C)... E)...</span>
                    </div>
                    <textarea 
                      rows={12}
                      className="w-full rounded-2xl border border-secondary/20 bg-secondary/5 p-8 text-sm font-mono text-slate-700 focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all leading-relaxed shadow-inner"
                      placeholder={form.type_id === 1 ? "Q) question...\nO) opt 1\nO) opt 2\nC) 1\nE) explanation..." : "C) case content...\nQ) sub-question...\nA) sub-answer...\nE) final explanation..."}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                    />
                  </div>
                </div>
                </div>
              </div>

              <div className="p-8 border-t border-border bg-muted/5 shrink-0">
                <div className="flex gap-4">
                  <Button 
                    onClick={handleRawImport}
                    disabled={saving}
                    className="h-14 bg-secondary text-secondary-foreground font-black uppercase tracking-widest rounded-2xl px-10 shadow-lg shadow-secondary/20 hover:-translate-y-1 transition-all flex-1 sm:flex-none"
                  >
                    {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" strokeWidth={3} />}
                    Import Question
                  </Button>
                  <Button 
                    onClick={() => setEditingId(null)} 
                    variant="outline"
                    className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-200 text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    <X className="mr-2 h-5 w-5" /> Cancel
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Question Dialog (Screen 2) */}
        <Dialog open={editingId !== null && editingId !== "new"} onOpenChange={(open) => !open && setEditingId(null)}>
          <DialogContent className="max-w-6xl p-0 overflow-hidden border-none shadow-2xl rounded-[32px] h-[94vh] flex flex-col">
            <div className="bg-background flex flex-col min-h-0 h-full">
              <div className="flex items-center justify-between border-b border-border px-8 py-5 shrink-0">
                <DialogTitle className="text-xl font-bold text-foreground">Edit Question</DialogTitle>
              </div>
              
              <div className="flex-1 min-h-0 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Question Text Display */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Question Content</label>
                      <div className="rounded-2xl border border-border bg-muted/5 p-6 prose prose-slate max-w-none">
                        <div className="text-base font-bold text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: form.question }} />
                      </div>
                    </div>

                    {/* Options Section */}
                    {form.type_id === 1 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Options</label>
                          <Button variant="ghost" size="sm" onClick={addOption} className="h-7 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                            <Plus className="mr-1 h-3 w-3" /> Add Option
                          </Button>
                        </div>
                        <div className="grid gap-3">
                          {form.options.map((opt: any, idx: number) => (
                            <div key={idx} className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${opt.correct ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'}`}>
                              <div 
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all cursor-pointer mt-1 ${opt.correct ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30 bg-transparent hover:border-primary/50'}`}
                                onClick={() => updateOption(idx, 'correct', !opt.correct)}
                              >
                                {opt.correct && <Check className="h-3 w-3 stroke-[4px]" />}
                              </div>
                              <textarea
                                rows={2}
                                value={opt.option}
                                onChange={(e) => updateOption(idx, 'option', e.target.value)}
                                className="flex-1 font-bold text-sm bg-transparent border-none focus:ring-0 outline-none resize-none py-1"
                              />
                              <button onClick={() => removeOption(idx)} className="text-destructive/30 hover:text-destructive transition-colors mt-1">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sub-questions for CBQ */}
                    {form.type_id === 2 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sub-Questions</label>
                          <Button variant="ghost" size="sm" onClick={addSubQuestion} className="h-7 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                            <Plus className="mr-1 h-3 w-3" /> Add Sub-Question
                          </Button>
                        </div>
                        <div className="grid gap-4">
                          {form.sub_questions.map((sq: any, idx: number) => (
                            <div key={idx} className="rounded-2xl border border-border bg-muted/5 p-6 space-y-4 relative group/sq">
                              <button onClick={() => removeSubQuestion(idx)} className="absolute right-4 top-4 text-destructive/30 hover:text-destructive opacity-0 group-hover/sq:opacity-100 transition-all">
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sub-question {idx + 1}</label>
                                <textarea
                                  rows={2}
                                  value={sq.subquestion_text}
                                  onChange={(e) => updateSubQuestion(idx, 'subquestion_text', e.target.value)}
                                  className="w-full font-bold text-sm bg-background rounded-xl border border-border p-3 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-primary">Answer</label>
                                <textarea
                                  rows={2}
                                  value={sq.answer_html}
                                  onChange={(e) => updateSubQuestion(idx, 'answer_html', e.target.value)}
                                  className="w-full font-medium text-sm italic bg-background rounded-xl border border-border p-3 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Explanation Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Explanation (E) - HTML Supported</label>
                        <button className="text-[10px] font-black uppercase text-primary hover:underline transition-all">Switch to Edit Code</button>
                      </div>
                      <div className="rounded-3xl border border-border bg-background shadow-sm overflow-hidden flex flex-col">
                        {renderToolbar('explanation')}
                        <textarea 
                          rows={8}
                          className="w-full bg-transparent p-6 text-sm font-medium text-slate-700 focus:ring-0 outline-none transition-all leading-relaxed whitespace-pre-wrap"
                          value={form.explanation}
                          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                          placeholder="Write or paste explanation HTML here..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sidebar: Metadata & Figures */}
                  <div className="space-y-8 lg:border-l lg:border-border lg:pl-10">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Metadata</h4>
                        <div className="grid gap-4">
                          <div className="space-y-1.5 flex-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Type</label>
                            <select 
                              value={form.type_id} 
                              onChange={(e) => setForm({ ...form, type_id: parseInt(e.target.value) })}
                              className="w-full h-10 rounded-xl border border-border bg-muted/5 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                            >
                              <option value={1}>MCQ</option>
                              <option value={2}>Case Based</option>
                            </select>
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Period</label>
                            <select 
                              value={form.period_id || 1} 
                              onChange={(e) => setForm({ ...form, period_id: parseInt(e.target.value) })}
                              className="w-full h-10 rounded-xl border border-border bg-muted/5 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                            >
                              <option value={1}>Mid</option>
                              <option value={2}>Final</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <hr className="border-border/50" />

                      {renderFigureSection('figures', '📷 Question Images', 1, 'primary')}
                      
                      <hr className="border-border/50" />
                      
                      {renderFigureSection('explanation_figures', '📝 Explanation Images', 2, 'secondary')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-border bg-muted/5 shrink-0">
                <div className="flex gap-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="h-14 bg-secondary text-secondary-foreground hover:bg-secondary/90 flex-1 sm:flex-none px-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-secondary/20 transition-all hover:-translate-y-1"
                  >
                    {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" strokeWidth={3} />}
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => setEditingId(null)} 
                    variant="outline" 
                    className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-200 text-slate-400 hover:bg-slate-50 transition-all"
                  >
                     Cancel
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}



function QuestionCard({ q, idx, handleEdit, handleDelete, toggleActive }: any) {
  const [showExplanation, setShowExplanation] = useState(false)

  return (
    <div className={`group relative bg-background rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md ${!q.active ? 'grayscale opacity-70' : ''}`}>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Case {idx + 1}</span>
              <div className="flex gap-1.5">
                {q.type_id === 1 && <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">MCQ</span>}
                {q.type_id === 2 && <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 border border-purple-100">Case Based</span>}
                {q.period_id === 1 && <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">Mid</span>}
                {q.period_id === 2 && <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">Final</span>}
              </div>
            </div>
            <div className="prose prose-slate max-w-none">
              <div className="text-lg font-bold text-foreground leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: q.question_text }} />
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 bg-muted/30 p-1.5 rounded-xl border border-border/50">
            <button onClick={() => toggleActive(q)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-background transition-colors" title="Toggle Active">
              {q.active ? <ToggleRight className="h-6 w-6 text-green-500" strokeWidth={2.5} /> : <ToggleLeft className="h-6 w-6" strokeWidth={2.5} />}
            </button>
            <button onClick={() => handleEdit(q)} className="p-2 text-muted-foreground hover:text-secondary rounded-lg hover:bg-background transition-colors" title="Edit">
              <Edit className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button onClick={() => handleDelete(q.id)} className="p-2 text-destructive/60 hover:text-destructive rounded-lg hover:bg-background transition-colors" title="Delete">
              <Trash2 className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Figures */}
        {q.figures?.length > 0 && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
            {q.figures.map((fig: any) => (
              <div key={fig.id} className="relative group/fig">
                <img 
                  src={fig.image_url} 
                  alt="Question figure" 
                  className="h-32 w-auto rounded-xl border border-border shadow-sm hover:scale-105 transition-transform" 
                />
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase">
                  {fig.type_id === 2 ? "Explanation" : "Figure"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Options Rendering Condensed */}
        {q.type_id === 1 && q.options?.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 ml-1">
            {q.options.map((opt: any, oIdx: number) => (
              <div 
                key={opt.id} 
                className="flex items-start gap-3 py-0.5"
              >
                <div className={`mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${opt.correct ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-transparent'}`} />
                <div className={`text-sm leading-tight flex-1 ${opt.correct ? 'text-green-700 font-bold' : 'text-slate-500 font-medium'}`} dangerouslySetInnerHTML={{ __html: opt.option }} />
              </div>
            ))}
          </div>
        )}

        {/* Sub-questions for Case Based */}
        {q.type_id === 2 && q.sub_questions?.length > 0 && (
          <div className="space-y-4 pt-4">
            {q.sub_questions.map((sq: any, sIdx: number) => (
              <div key={sq.id} className="bg-muted/10 rounded-2xl border border-border/50 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black">{sIdx + 1}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sub-question</span>
                </div>
                <div className="text-sm font-bold text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sq.subquestion_text }} />
                {sq.answer_html && (
                  <div className="pl-4 border-l-2 border-primary/20 mt-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">Answer:</span>
                    <div className="text-sm text-foreground/80 italic" dangerouslySetInnerHTML={{ __html: sq.answer_html }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Explanation Accordion */}
        {q.explanation_html && (
          <div className="pt-4">
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors group/exp"
            >
              <ChevronRightIcon className={`h-3 w-3 transition-transform duration-300 ${showExplanation ? 'rotate-90 text-primary' : ''}`} />
              EXPLANATION
            </button>
            {showExplanation && (
              <div className="mt-4 p-6 rounded-2xl bg-muted/5 border border-border animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: q.explanation_html }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
