"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { 
  CookingPot, 
  Plus, 
  Database, 
  BookOpen, 
  Flag, 
  CheckCircle, 
  Loader2, 
  ChevronRight,
  ArrowRight,
  ClipboardList,
  LayoutDashboard,
  Search,
  Filter,
  Check,
  X,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import useSWR from "swr"

/* --- Types --- */
type QuestionStatus = "unclassified" | "draft" | "flagged" | "pending_approval" | "approved"

interface KitchenQuestion {
  id: number
  question: string
  explanation: string
  subject_id: number | null
  status: QuestionStatus
  creator_id: number
}

interface Course {
  id: number
  name: string
  lecture_count: number
  mcq_count: number
  kitchen_total: number
  kitchen_classified: number
  kitchen_unclassified: number
  kitchen_percentage: number
}

export default function KitchenPage() {
  const { user, isAdmin, isInstructor } = useAuth()
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [activeSection, setActiveSection] = useState<string>(isAdmin ? "approvals" : "selection")
  const [unclassifiedCount, setUnclassifiedCount] = useState(0)
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0)
  
  // Data Fetching
  const { data: allCourses } = useSWR<Course[]>("/api/courses/all")
  const { data: subjects } = useSWR(selectedCourse ? `/api/courses/${selectedCourse.id}/subjects` : null)
  const { data: unclassifiedQuestions, mutate: mutatePool } = useSWR<KitchenQuestion[]>(
    selectedCourse ? `/api/admin/kitchen?course_id=${selectedCourse.id}&status=unclassified` : null
  )
  const { data: pendingApprovalQuestions, mutate: mutateApprovals } = useSWR<KitchenQuestion[]>(
    isAdmin ? `/api/admin/kitchen/all-pending` : null
  )

  useEffect(() => {
    if (unclassifiedQuestions) setUnclassifiedCount(unclassifiedQuestions.length)
    if (pendingApprovalQuestions) setPendingApprovalCount(pendingApprovalQuestions.length)
  }, [unclassifiedQuestions, pendingApprovalQuestions])
  
  // Derived state: Filter allowed courses for instructors
  const allowedCourseNames = user?.allowed_courses || []
  const availableCourses = isAdmin 
    ? allCourses 
    : allCourses?.filter(c => allowedCourseNames.includes(c.name))

  if (!user || (!isAdmin && !isInstructor)) {
    return <div className="p-10 text-center">Unauthorized</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-secondary p-2 rounded-lg">
              <CookingPot className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">The Kitchen</h1>
              <p className="text-xs text-slate-500">Question Classification & Preparation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {selectedCourse && (
              <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                <BookOpen className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                  {selectedCourse.name}
                </span>
                <button 
                  onClick={() => { setSelectedCourse(null); setActiveSection("selection") }}
                  className="ml-1 p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 text-slate-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!selectedCourse ? (
          <SelectionView 
            courses={availableCourses || []} 
            isAdmin={isAdmin}
            onSelect={(c) => { setSelectedCourse(c); setActiveSection("pool") }} 
          />
        ) : (
          <div className="space-y-8">
            {/* Workspace Header Inspired by Reference */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
              <div className="space-y-4">
                <button 
                  onClick={() => { setSelectedCourse(null); setActiveSection("selection") }}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-orange-500 uppercase tracking-widest transition-colors group"
                >
                  <ArrowRight className="h-3 w-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Back to Dashboard
                </button>
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{selectedCourse.name}</h2>
                  <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs font-bold border-slate-200 text-slate-500">
                    Export All
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatBadge label="Total" value={selectedCourse.kitchen_total} color="bg-slate-100 text-slate-500" />
                <StatBadge label="Classified" value={selectedCourse.kitchen_classified} color="bg-green-50 text-green-600" />
                <StatBadge label="Unclassified" value={selectedCourse.kitchen_unclassified} color="bg-orange-50 text-orange-600 underline decoration-2 underline-offset-4" />
              </div>
            </div>

            {/* Tabs Inspired by Reference */}
            <div className="bg-white p-1 rounded-2xl border border-slate-200 inline-flex items-center gap-1">
               <TabButton 
                active={activeSection === "import"} 
                onClick={() => setActiveSection("import")}
                icon={Plus} 
                label="Add Question" 
              />
              <TabButton 
                active={activeSection === "pool"} 
                onClick={() => setActiveSection("pool")}
                icon={null}
                label={`Unclassified (${unclassifiedCount})`} 
              />
              <TabButton 
                active={activeSection === "lectures"} 
                onClick={() => setActiveSection("lectures")}
                icon={null}
                label="Lectures" 
              />
              <TabButton 
                active={activeSection === "all"} 
                onClick={() => setActiveSection("all")}
                icon={null}
                label="All" 
              />
              <TabButton 
                active={activeSection === "flagged"} 
                onClick={() => setActiveSection("flagged")}
                icon={null}
                label="Flagged (2)" 
              />
            </div>

            {/* Main Content Area */}
            <div className="min-h-[500px]">
              {activeSection === "approvals" && isAdmin && (
                <ApprovalsView 
                  questions={pendingApprovalQuestions || []} 
                  mutate={mutateApprovals} 
                />
              )}
              {activeSection === "import" && (
                <ImportView 
                  courseId={selectedCourse.id} 
                  onSuccess={() => { setActiveSection("pool"); mutatePool() }} 
                />
              )}
              {activeSection === "pool" && (
                <PoolView 
                  courseId={selectedCourse.id} 
                  questions={unclassifiedQuestions || []} 
                  subjects={subjects || []}
                  mutate={mutatePool}
                  onStartWorkflow={() => setActiveSection("workflow")}
                />
              )}
              {activeSection === "workflow" && (
                 <WorkflowView 
                  questions={unclassifiedQuestions || []}
                  subjects={subjects || []}
                  mutate={mutatePool}
                  onClose={() => setActiveSection("pool")}
                 />
              )}
              {activeSection === "lectures" && (
                <LecturesView 
                  courseId={selectedCourse.id} 
                  subjects={subjects || []} 
                />
              )}
              {activeSection === "flagged" && <FlaggedView courseId={selectedCourse.id} />}
              {activeSection === "all" && <AllQuestionsView courseId={selectedCourse.id} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NavButton({ active, icon: Icon, label, onClick, badge, badgeColor = "bg-primary" }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
        active 
          ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
          : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className={`h-5 w-5 ${active ? "text-orange-500" : "text-slate-400"}`} />}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {badge && (
        <span className={`px-2 py-0.5 ${badgeColor} text-white text-[10px] font-bold rounded-full`}>
          {badge}
        </span>
      )}
    </button>
  )
}

function TabButton({ active, icon: Icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 ${
        active 
          ? "bg-orange-50/50 text-orange-600 border border-orange-100 shadow-sm" 
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  )
}

function StatBadge({ label, value, color }: { label: string, value: any, color: string }) {
  return (
    <div className={`px-4 py-2 rounded-xl flex items-center gap-3 ${color} border border-transparent`}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}:</span>
      <span className="text-sm font-black tracking-tight">{value}</span>
    </div>
  )
}

function SelectionView({ courses, onSelect, isAdmin }: { courses: Course[], onSelect: (c: Course) => void, isAdmin: boolean }) {
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Courses</h2>
          <p className="text-slate-500 font-medium">Manage and classify questions for your assigned courses.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-12 px-6 shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5">
              <Plus className="h-5 w-5 mr-2" />
              New Course
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12 px-6 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
              <Plus className="h-5 w-5 mr-2" />
              New Case Course
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <button
            key={course.id}
            onClick={() => onSelect(course)}
            className="group bg-white border border-slate-200 rounded-[24px] p-6 text-left transition-all hover:shadow-2xl hover:shadow-slate-200 hover:border-orange-500/50 flex flex-col gap-6 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors uppercase tracking-wide pr-8">
                {course.name}
              </h3>
              <div className="absolute top-6 right-6 p-2 rounded-lg bg-slate-50 group-hover:bg-orange-50 transition-colors">
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-orange-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Kitchen</p>
                <p className="text-lg font-black text-slate-700">{course.kitchen_total} Questions</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unclassified</p>
                <p className="text-lg font-black text-orange-600">{course.kitchen_unclassified}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                <div 
                  className={`h-full transition-all duration-1000 ${course.kitchen_percentage === 100 ? 'bg-orange-500' : 'bg-orange-400 opacity-60'}`}
                  style={{ width: `${course.kitchen_percentage}%` }}
                />
              </div>
              <p className="text-[11px] font-black text-right text-orange-500/80 uppercase tracking-tighter italic">
                {course.kitchen_percentage}% Classified
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* Placeholder Views - To be implemented next */
function ImportView({ courseId, onSuccess }: any) {
  const [importText, setImportText] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    if (!importText.trim()) return
    setIsImporting(true)
    try {
      const blocks = importText.split(/(?:^|\n)\s*(?=Q\))/g).filter(b => b.trim().length > 5)
      
      const parseMCQ = (text: string) => {
        const questionMatch = text.match(/Q\)\s*([\s\S]*?)\s*(?=\n\s*O\)|\n\s*C\)|\n\s*E\)|$)/i)
        const question = questionMatch ? questionMatch[1].trim() : ""

        const optionMatches = [...text.matchAll(/(?:\n|^)\s*O\)\s*([\s\S]*?)\s*(?=\n\s*O\)|\n\s*C\)|\n\s*E\)|$)/gi)]
        const options = optionMatches.map(m => m[1].trim())

        const correctMatch = text.match(/(?:\n|^)\s*C\)\s*(\d+)/i)
        const correctIdx = correctMatch ? parseInt(correctMatch[1]) : 0

        const explanationMatch = text.match(/(?:\n|^)\s*E\)\s*([\s\S]*)$/i)
        const explanation = explanationMatch ? explanationMatch[1].trim() : ""

        return {
          question,
          explanation,
          options: options.map((opt, i) => ({
            option: opt,
            correct: (i + 1) === correctIdx
          })),
          type_id: 1
        }
      }

      const questionsData = blocks.map(parseMCQ)

      const res = await fetch("/api/admin/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, questions: questionsData })
      })
      if (res.ok) {
        setImportText("")
        onSuccess()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsImporting(false)
    }
  }

  const questionCount = importText.split(/(?:^|\n)\s*(?=Q\))/g).filter(b => b.trim().length > 5).length

  return (
    <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Paste MCQs</h3>
        <p className="text-slate-500 font-medium text-sm">
          Paste in Q/O/C/E format. <br/>
          <span className="inline-flex items-center gap-1.5 mt-2 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-[10px] font-black uppercase">Q) question</span>
          <span className="inline-flex items-center gap-1.5 mt-2 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-[10px] font-black uppercase">O) option</span>
          <span className="inline-flex items-center gap-1.5 mt-2 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-[10px] font-black uppercase">C) correct index</span>
          <span className="inline-flex items-center gap-1.5 mt-2 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-[10px] font-black uppercase">E) explanation</span>
        </p>
      </div>

      <div className="relative">
        <textarea 
          className="w-full h-96 p-8 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-orange-500/10 focus:bg-white focus:border-orange-500 outline-none transition-all font-mono text-sm leading-relaxed text-slate-700 shadow-inner"
          placeholder="Q) Identify this structure.&#10;O) Cerebellum&#10;O) Cerebrum&#10;...&#10;C) 1&#10;E) <p>It is the cerebellum...</p>"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        {importText && (
          <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-200">
            {questionCount} Detected
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleImport} 
          disabled={isImporting || !importText.trim()}
          className="bg-orange-500 hover:bg-orange-600 text-white font-black h-14 px-12 rounded-2xl shadow-xl shadow-orange-100 transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 uppercase tracking-widest text-xs gap-3"
        >
          {isImporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
          Process Questions
        </Button>
      </div>
    </div>
  )
}

function PoolView({ courseId, questions, subjects, mutate, onStartWorkflow }: any) {
  const [isClassifying, setIsClassifying] = useState<number | null>(null)

  const handleUpdate = async (id: number, data: any) => {
    setIsClassifying(id)
    try {
      await fetch(`/api/admin/kitchen/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      mutate()
    } finally {
      setIsClassifying(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return
    await fetch(`/api/admin/kitchen/${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-100 p-6 rounded-[24px] flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-orange-900 uppercase tracking-tight">You have {questions.length} unclassified questions.</h3>
          <p className="text-orange-700/70 text-sm font-medium">Use the workflow to quickly categorize them.</p>
        </div>
        <Button 
          onClick={onStartWorkflow}
          className="bg-orange-500 hover:bg-orange-600 text-white font-black h-12 px-8 rounded-xl shadow-lg shadow-orange-200 flex items-center gap-2 uppercase tracking-widest text-xs"
        >
          Start Classification Workflow
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        {questions.length === 0 ? (
          <div className="bg-white p-20 rounded-[32px] border border-slate-200 border-dashed text-center space-y-3">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-tight">The pool is empty! Magic.</p>
          </div>
        ) : (
          questions.map((q: any, idx: number) => (
            <div key={q.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:border-orange-200 transition-all space-y-6 group">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-100 italic">
                      Unclassified
                    </span>
                  </div>
                  <p className="text-slate-800 font-bold text-lg leading-relaxed">{idx + 1}. {q.question}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(q.id)}>
                    <X className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-10 px-4 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl font-bold text-xs uppercase tracking-widest" onClick={() => {}}>
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-50">
                <div className="relative">
                   <select 
                    className="appearance-none bg-slate-50 border border-slate-100 text-slate-700 font-bold text-xs rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all cursor-pointer min-w-[200px]"
                    onChange={(e) => handleUpdate(q.id, { subject_id: e.target.value, status: 'draft' })}
                    value={q.subject_id || ""}
                  >
                    <option value="">Select Subject...</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.subject}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-300 pointer-events-none" />
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl h-11 border-slate-200 text-slate-400 hover:text-violet-600 hover:bg-violet-50 hover:border-violet-100 font-black text-[10px] uppercase tracking-widest transition-all"
                  onClick={async () => {
                    const res = await fetch("/api/admin/kitchen/classify-ai", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ question: q.question, subjects })
                    })
                    const data = await res.json()
                    if (data.suggested_subject_id) {
                      handleUpdate(q.id, { subject_id: data.suggested_subject_id, status: 'draft' })
                    }
                  }}
                >
                  ✨ AI Suggest
                </Button>

                <div className="flex-1" />

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-11 px-4 text-slate-300 hover:text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                  onClick={() => handleUpdate(q.id, { status: 'flagged' })}
                >
                  <Flag className="h-3.5 w-3.5 mr-2" />
                  Flag for later
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function LecturesView({ courseId, subjects }: any) {
  const { data: draftQuestions, mutate } = useSWR<KitchenQuestion[]>(
    courseId ? `/api/admin/kitchen?course_id=${courseId}&status=draft` : null
  )

  const handleAction = async (id: number, status: string) => {
    await fetch(`/api/admin/kitchen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })
    mutate()
  }

  const handleApproveAll = async (subjectId: number) => {
    const qsInSubject = draftQuestions?.filter(q => q.subject_id === subjectId) || []
    for (const q of qsInSubject) {
      await fetch(`/api/admin/kitchen/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending_approval" })
      })
    }
    mutate()
  }

  // Group questions by subject
  const subjectsWithDrafts = subjects.map((sub: any) => ({
    ...sub,
    questions: draftQuestions?.filter(q => q.subject_id === sub.id) || []
  })).filter((s: any) => draftQuestions ? true : false) // Show all subjects or just with drafts? Reference shows "Existing Lectures"

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Existing Lectures</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectsWithDrafts.length === 0 ? (
            <div className="md:col-span-2 text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No lectures created yet.</p>
            </div>
          ) : (
            subjectsWithDrafts.map((sub: any) => (
              <div key={sub.id} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:border-orange-500/50 transition-all group flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 uppercase tracking-tight group-hover:text-orange-600 transition-colors">{sub.subject}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub.questions.length} Questions</p>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
                      <X className="h-4 w-4" />
                   </Button>
                   <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-orange-50 transition-colors">
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500" />
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function FlaggedView({ courseId }: any) {
  const { data: questions, mutate } = useSWR<KitchenQuestion[]>(
    courseId ? `/api/admin/kitchen?course_id=${courseId}&status=flagged` : null
  )

  const handleRestore = async (id: number) => {
    await fetch(`/api/admin/kitchen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "unclassified" })
    })
    mutate()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-red-500" />
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Flagged Questions</h3>
      </div>
      <div className="grid gap-3">
        {questions?.length === 0 ? (
          <div className="bg-white p-20 rounded-[32px] border border-slate-200 border-dashed text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No flagged questions. Good job!</p>
          </div>
        ) : (
          questions?.map((q: any, idx: number) => (
            <div key={q.id} className="bg-white p-6 rounded-[24px] border border-red-50 flex items-center justify-between shadow-sm">
              <p className="text-sm font-bold text-slate-700 truncate mr-4">{idx + 1}. {q.question}</p>
              <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl px-4 h-10" onClick={() => handleRestore(q.id)}>
                Restore to Pool
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AllQuestionsView({ courseId }: any) {
  const { data: questions } = useSWR<KitchenQuestion[]>(
    courseId ? `/api/admin/kitchen?course_id=${courseId}` : null
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-slate-400" />
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">All Kitchen Questions</h3>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px] w-16">No.</th>
              <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Question</th>
              <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Subject</th>
              <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {questions?.map((q: any, idx: number) => (
              <tr key={q.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-5 font-black text-slate-300 text-[10px]">{idx + 1}</td>
                <td className="px-8 py-5 text-slate-700 font-bold max-w-xs">{q.question.substring(0, 100)}...</td>
                <td className="px-8 py-5 text-slate-500 font-medium">{q.subject_name || "-"}</td>
                <td className="px-8 py-5">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    q.status === 'unclassified' ? 'bg-slate-100 text-slate-500' :
                    q.status === 'draft' ? 'bg-blue-50 text-blue-600' :
                    q.status === 'flagged' ? 'bg-red-50 text-red-600 border border-red-100' :
                    q.status === 'pending_approval' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-green-50 text-green-600 border border-green-100'
                  }`}>
                    {q.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


function WorkflowView({ questions, subjects, mutate, onClose }: any) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  
  const q = questions[currentIndex]
  
  const [editData, setEditData] = useState<any>(null)

  useEffect(() => {
    if (q) {
      setEditData({
        question: q.question,
        options: q.options || ["", "", "", ""],
        correct_index: q.correct_index || 0,
        explanation: q.explanation || "",
        subject_id: q.subject_id
      })
    }
  }, [q])

  if (!q || !editData) {
    return (
      <div className="bg-white p-20 rounded-[32px] border border-slate-200 text-center space-y-4">
        <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Classification Complete!</h3>
        <p className="text-slate-500">You've reached the end of the unclassified pool.</p>
        <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-orange-100">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  const handleUpdate = async (data: any, next = true) => {
    setIsSaving(true)
    try {
      await fetch(`/api/admin/kitchen/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editData, ...data })
      })
      if (next) {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          mutate() // Refresh pool
          onClose()
        }
      } else {
        mutate()
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Left Column: Edit Content */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Question #{currentIndex + 1}: Edit MCQ</h3>
            <div className="flex items-center gap-3">
              <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Auto-Clean On
              </span>
              <Button variant="ghost" size="sm" className="h-8 text-slate-400 font-bold text-[10px] uppercase tracking-widest" onClick={() => handleUpdate({ status: 'flagged' })}>
                <Flag className="h-3 w-3 mr-1.5 text-slate-300" />
                Flag
              </Button>
              <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest italic pt-0.5">
                {questions.length - currentIndex} Remaining
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Text</p>
                <textarea 
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:bg-white outline-none transition-all text-slate-800 font-medium text-sm leading-relaxed"
                  value={editData.question}
                  onChange={(e) => setEditData({ ...editData, question: e.target.value })} 
                />
             </div>

             <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Options</p>
                <div className="space-y-2">
                   {editData.options.map((opt: string, i: number) => (
                     <div key={i} className={`flex items-center gap-3 bg-white border ${editData.correct_index === i ? 'border-orange-500 bg-orange-50/10' : 'border-slate-100'} p-3 rounded-2xl hover:border-slate-200 transition-all group`}>
                        <button 
                          onClick={() => setEditData({ ...editData, correct_index: i })}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${editData.correct_index === i ? 'border-orange-500 bg-orange-500' : 'border-slate-200 hover:border-orange-200'}`}
                        >
                          {editData.correct_index === i && <div className="w-2 h-2 rounded-full bg-white" />}
                        </button>
                        <input 
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...editData.options]
                            newOpts[i] = e.target.value
                            setEditData({ ...editData, options: newOpts })
                          }}
                          className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300"
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        />
                     </div>
                   ))}
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Explanation (HTML Supported)</p>
                </div>
                <textarea 
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:bg-white outline-none transition-all text-slate-800 font-medium text-sm leading-relaxed"
                  value={editData.explanation}
                  onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                />
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between items-end">
           <Button 
            variant="ghost" 
            className="text-slate-400 font-bold group"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          >
            Previous
          </Button>
          <div className="flex items-center gap-4">
             <Button 
              variant="outline" 
              className="border-slate-200 text-slate-600 font-bold h-12 px-8 rounded-xl"
              onClick={() => setCurrentIndex(currentIndex + 1)}
            >
              Skip to Next
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white font-black h-12 px-10 rounded-xl shadow-lg shadow-orange-100 uppercase tracking-widest text-xs"
              onClick={() => handleUpdate({ status: editData.subject_id ? 'draft' : 'unclassified' })}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save & Next"}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Classification */}
      <div className="lg:col-span-1 space-y-4">
         <div className="bg-white rounded-[32px] border border-slate-200 p-6 space-y-6 sticky top-24">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classify to Lecture</p>
            
            <Button 
              className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              onClick={async () => {
                const res = await fetch("/api/admin/kitchen/classify-ai", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ question: editData.question, subjects })
                })
                const data = await res.json()
                if (data.suggested_subject_id) {
                  setEditData({ ...editData, subject_id: data.suggested_subject_id })
                  // Optional: handleUpdate({ subject_id: data.suggested_subject_id, status: 'draft' })
                }
              }}
            >
              ✨ AI Auto-Classify
            </Button>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                placeholder="Search lectures..."
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {subjects.map((s: any) => (
                <button 
                  key={s.id}
                  onClick={() => {
                    setEditData({ ...editData, subject_id: s.id })
                    handleUpdate({ subject_id: s.id, status: 'draft' })
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all group flex items-center justify-between ${editData.subject_id === s.id ? 'border-orange-200 bg-orange-50' : 'border-slate-50 hover:border-orange-100 hover:bg-slate-50'}`}
                >
                  <span className={`text-sm font-bold ${editData.subject_id === s.id ? 'text-orange-600' : 'text-slate-600'}`}>{s.subject}</span>
                  <ArrowRight className={`h-4 w-4 ${editData.subject_id === s.id ? 'text-orange-500' : 'text-slate-200 group-hover:text-orange-400'}`} />
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100">
               <Button 
                variant="ghost" 
                className="w-full text-slate-400 font-bold hover:text-slate-600"
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              >
                Skip to Next
              </Button>
            </div>
         </div>
      </div>
    </div>
  )
}

function ApprovalsView({ questions, mutate }: any) {
  const handleAction = async (id: number, status: string, active: boolean) => {
    await fetch(`/api/admin/kitchen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, active })
    })
    mutate()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Approval Inbox</h3>
      </div>
      <div className="grid gap-4">
        {questions.length === 0 ? (
          <div className="bg-white p-20 rounded-[32px] border border-slate-200 border-dashed text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Everything approved! Inbox clear.</p>
          </div>
        ) : (
          questions.map((q: any, idx: number) => (
            <div key={q.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                      {q.course_name}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                    <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-100 italic">
                      {q.subject_name}
                    </span>
                  </div>
                  <p className="text-slate-800 font-bold text-lg leading-relaxed">{idx + 1}. {q.question}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white font-black h-11 px-8 rounded-xl shadow-lg shadow-green-100 uppercase tracking-widest text-[10px]"
                  onClick={() => handleAction(q.id, 'active', true)}
                >
                  Approve Question
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 font-bold h-11 px-6 rounded-xl hover:bg-red-50 uppercase tracking-widest text-[10px]"
                  onClick={() => handleAction(q.id, 'flagged', false)}
                >
                  Reject & Flag
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
