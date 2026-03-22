"use client"

import { useState, useEffect, useRef } from "react"
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
  Pencil,
  RefreshCw,
  RotateCcw,
  ToggleLeft,
  UploadCloud,
  Code,
  BrainCircuit,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  ImageIcon,
  Trash2
} from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import useSWR, { mutate as globalMutate } from "swr"
import { toast } from "sonner"
import { suggestCategoryAction } from "@/app/actions/ai-actions"

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
  active: boolean
  lecture_count: number
  mcq_count: number
  kitchen_total: number
  kitchen_classified: number
  kitchen_unclassified: number
  kitchen_percentage: number
  hero_image: string | null
}
interface DBSubject {
  id: number
  name: string
  course_id: number
  active: boolean
  question_count: number | string
}

export default function KitchenPage() {
  const { user, isAdmin, isInstructor } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [activeSection, setActiveSection] = useState<string>(isAdmin ? "approvals" : "selection")
  const [selectedPeriod, setSelectedPeriod] = useState<number>(2) // 1: Mid, 2: Final
  const [workflowIndex, setWorkflowIndex] = useState(0)
  const [unclassifiedCount, setUnclassifiedCount] = useState(0)
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0)
  
  // Data Fetching
  const { data: allCourses, mutate: mutateCourses } = useSWR<Course[]>("/api/courses/all")
  const { data: activeCourseSWR } = useSWR<Course>(selectedCourse ? `/api/courses/${selectedCourse.id}` : null)
  const { data: subjects, mutate: mutateSubjects } = useSWR<DBSubject[]>(selectedCourse ? `/api/courses/${selectedCourse.id}/subjects?all=true` : null)
  const { data: unclassifiedQuestions, mutate: mutatePool } = useSWR<any[]>(
    selectedCourse ? `/api/admin/kitchen?course_id=${selectedCourse.id}&status=unclassified,flagged&period_id=${selectedPeriod}` : null
  )
  const { data: pendingApprovalQuestions, mutate: mutateApprovals } = useSWR<any[]>(
    isAdmin ? `/api/admin/kitchen/all-pending` : null
  )
  const { data: draftQuestions, mutate: mutateDrafts } = useSWR<any[]>(
    selectedCourse ? `/api/admin/kitchen?course_id=${selectedCourse.id}${selectedPeriod ? `&period_id=${selectedPeriod}` : ''}` : null
  )

  // Sync state with URL on mount
  useEffect(() => {
    if (allCourses) {
      const courseId = searchParams.get("course_id")
      const periodId = searchParams.get("period_id")
      const section = searchParams.get("section")

      if (courseId) {
        const course = allCourses.find(c => c.id === parseInt(courseId))
        if (course) {
          setSelectedCourse(course)
          if (section) setActiveSection(section)
          else setActiveSection("pool")
        }
      }

      if (periodId) {
        setSelectedPeriod(parseInt(periodId))
      }
    }
  }, [allCourses, searchParams])

  // Update URL when state changes
  const updateUrl = (courseId: number | null, periodId: number, section: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (courseId) {
      params.set("course_id", courseId.toString())
      params.set("period_id", periodId.toString())
      params.set("section", section)
    } else {
      params.delete("course_id")
      params.delete("period_id")
      params.delete("section")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course)
    setActiveSection("pool")
    updateUrl(course.id, selectedPeriod, "pool")
  }

  const handlePeriodChange = (period: number) => {
    setSelectedPeriod(period)
    if (selectedCourse) updateUrl(selectedCourse.id, period, activeSection)
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (selectedCourse) updateUrl(selectedCourse.id, selectedPeriod, section)
  }

  const handleBackToDashboard = () => {
    setSelectedCourse(null)
    setActiveSection("selection")
    updateUrl(null, selectedPeriod, "selection")
  }
  

  useEffect(() => {
    if (unclassifiedQuestions) setUnclassifiedCount(unclassifiedQuestions.length)
    if (pendingApprovalQuestions) setPendingApprovalCount(pendingApprovalQuestions.length)
  }, [unclassifiedQuestions, pendingApprovalQuestions])
  
  // Derived state: Filter allowed courses for instructors
  const allowedCourseNames = user?.allowed_courses || []
  const availableCourses = isAdmin 
    ? allCourses 
    : allCourses?.filter(c => allowedCourseNames.map(ac => ac.toLowerCase()).includes(c.name.toLowerCase()))

  // Keep selected course data fresh from allCourses
  const activeCourse = selectedCourse ? allCourses?.find(c => c.id === selectedCourse.id) || selectedCourse : null

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
                  onClick={handleBackToDashboard}
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
            onSelect={handleCourseSelect} 
            mutate={mutateCourses}
          />
        ) : (
          <div className="space-y-8">
            {/* Workspace Header Inspired by Reference */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
              <div className="space-y-4">
                <button 
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-orange-500 uppercase tracking-widest transition-colors group"
                >
                  <ArrowRight className="h-3 w-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Back to Dashboard
                </button>
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{selectedCourse.name}</h2>
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button 
                      onClick={() => handlePeriodChange(1)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedPeriod === 1 ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Mid
                    </button>
                    <button 
                      onClick={() => handlePeriodChange(2)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedPeriod === 2 ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Final
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatBadge label="Total" value={activeCourse?.kitchen_total || 0} color="bg-slate-100 text-slate-500" />
                <StatBadge label="Classified" value={activeCourse?.kitchen_classified || 0} color="bg-green-50 text-green-600" />
                <StatBadge label="Unclassified" value={activeCourse?.kitchen_unclassified || 0} color="bg-orange-50 text-orange-600 underline decoration-2 underline-offset-4" />
              </div>
            </div>

            {/* Tabs Inspired by Reference */}
            <div className="bg-white p-1 rounded-2xl border border-slate-200 inline-flex items-center gap-1">
               <TabButton 
                active={activeSection === "import"} 
                onClick={() => handleSectionChange("import")}
                icon={Plus} 
                label="Add Question" 
              />
              <TabButton 
                active={activeSection === "pool"} 
                onClick={() => handleSectionChange("pool")}
                icon={null}
                label={`Pool (${unclassifiedQuestions?.length || 0})`} 
              />
              <TabButton 
                active={activeSection === "lectures"} 
                onClick={() => handleSectionChange("lectures")}
                icon={null}
                label="Lectures" 
              />
              <TabButton 
                active={activeSection === "all"} 
                onClick={() => handleSectionChange("all")}
                icon={null}
                label="All" 
              />
              <TabButton 
                active={activeSection === "flagged"} 
                onClick={() => handleSectionChange("flagged")}
                icon={null}
                label={`Flagged (${unclassifiedQuestions?.filter(q => q.status === 'flagged').length || 0})`} 
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
                <ImportMCQDialog 
                  courseId={selectedCourse.id} 
                  onSuccess={() => {
                    mutatePool()
                    mutateDrafts()
                    handleSectionChange("pool")
                  }}
                  selectedPeriod={selectedPeriod}
                />
              )}
              {activeSection === "pool" && (
                <PoolView 
                  courseId={selectedCourse.id} 
                  questions={unclassifiedQuestions || []} 
                  subjects={subjects || []}
                  mutate={mutatePool}
                  onStartWorkflow={() => { setWorkflowIndex(0); handleSectionChange("workflow") }}
                  onEditQuestion={(idx: number) => { setWorkflowIndex(idx); handleSectionChange("workflow") }}
                />
              )}
              {activeSection === "workflow" && (
                 <WorkflowView 
                  courseId={selectedCourse.id}
                  questions={unclassifiedQuestions || []}
                  subjects={subjects || []}
                  mutate={mutatePool}
                  mutateDrafts={mutateDrafts}
                  mutateSubjects={mutateSubjects}
                  mutateCourses={mutateCourses}
                  onClose={() => handleSectionChange("pool")}
                  courseName={selectedCourse?.name}
                  initialIndex={workflowIndex}
                 />
              )}
              {activeSection === "lectures" && activeCourse && (
                <LecturesView 
                  courseId={activeCourse.id} 
                  subjects={subjects || []} 
                  draftQuestions={draftQuestions || []}
                  mutateDrafts={mutateDrafts}
                  mutateSubjects={mutateSubjects}
                  isAdmin={isAdmin}
                  isInstructor={isInstructor}
                  mutateCourses={mutateCourses}
                  setActiveSection={setActiveSection}
                />
              )}
              {activeSection === "flagged" && (
                <FlaggedView 
                  courseId={selectedCourse.id} 
                  onEdit={(qId: number) => {
                    const idx = unclassifiedQuestions?.findIndex(qu => qu.id === qId) ?? 0;
                    setWorkflowIndex(idx);
                    handleSectionChange("workflow");
                  }}
                />
              )}
              {activeSection === "all" && (
                <AllQuestionsView 
                  courseId={selectedCourse.id} 
                  setActiveSection={setActiveSection}
                  subjects={subjects || []}
                  mutatePool={mutatePool}
                  mutateDrafts={mutateDrafts}
                />
              )}
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

function SelectionView({ courses, onSelect, isAdmin, mutate }: { courses: Course[], onSelect: (c: Course) => void, isAdmin: boolean, mutate: any }) {
  const [newCourseName, setNewCourseName] = useState("")
  const [newCourseImage, setNewCourseImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const stagingCourses = (courses || []).filter(c => !Boolean(c.active))
  const activeCourses = (courses || []).filter(c => Boolean(c.active))

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewCourseImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleCreate = async () => {
    if (!newCourseName || !newCourseImage) {
      toast.error("Name and Image are required")
      return
    }
    
    setIsCreating(true)
    const toastId = toast.loading("Creating course...")
    
    try {
      const formData = new FormData()
      formData.append("file", newCourseImage)
      
      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData
      })
      
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || "Image upload failed")
      }
      const uploadData = await uploadRes.json()
      const imageUrl = uploadData.secure_url

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCourseName, background: imageUrl })
      })
      
      if (res.ok) {
        toast.success("Course created successfully!", { id: toastId })
        setNewCourseName("")
        setNewCourseImage(null)
        setPreviewUrl(null)
        mutate()
      } else {
        const err = await res.json()
        throw new Error(err.error || "Failed to create course")
      }
    } catch (e: any) {
      toast.error(e.message, { id: toastId })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, courseId: number) => {
    e.stopPropagation()
    if (!confirm("Are you sure? This will delete all questions in this course.")) return
    
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Deleted")
        mutate()
      }
    } catch (e) {
      toast.error("Failed to delete")
    }
  }

  const handleToggleStatus = async (e: React.MouseEvent, courseId: number, currentStatus: boolean) => {
    e.stopPropagation()
    const action = currentStatus ? "deactivate" : "activate"
    if (!confirm(`Are you sure you want to ${action} this course?`)) return

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      if (res.ok) {
        toast.success(currentStatus ? "Course deactivated" : "Course activated")
        mutate()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to update status")
      }
    } catch (e) {
      toast.error("Failed to update status")
    }
  }

  const renderCourseCard = (course: any) => {
    const isMiniOSCE = course.name.toLowerCase().includes("(miniosce)")
    const isFinal = course.name.toLowerCase().includes("(final)")
    
    let displayName = course.name
    if (isMiniOSCE) displayName = displayName.replace(/\(miniosce\)/i, "").trim()
    if (isFinal) displayName = displayName.replace(/\(final\)/i, "").trim()

    const isActive = Boolean(course.active)
    const showFinalOutline = isFinal && isActive

    return (
      <div
        key={course.id}
        onClick={() => onSelect(course)}
        className={`group bg-white border border-slate-100 rounded-[40px] p-2 text-left transition-all hover:shadow-2xl hover:shadow-slate-200 flex flex-col gap-4 relative overflow-hidden min-h-[520px] cursor-pointer ${
          showFinalOutline ? "ring-4 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : ""
        }`}
      >
        {/* Header Image */}
        <div className="h-44 bg-slate-100 rounded-[32px] overflow-hidden relative shadow-inner">
          <img 
            src={course.hero_image || "/images/courses/default.jpg"} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            alt={course.name} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Indicators Layer */}
          <div className="absolute inset-x-0 top-0 p-4 z-10 flex flex-col gap-2">
            {isFinal && (
               <div className="bg-red-600/90 backdrop-blur-md px-4 py-2 rounded-xl flex justify-center items-center shadow-2xl shadow-red-900/20 border border-red-400/20 animate-pulse mr-10 transition-all">
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] ml-[0.4em]">FINAL</span>
               </div>
            )}
            
            <div className="flex justify-end pr-10">
              {isMiniOSCE && (
                 <span className="rounded-full bg-orange-500/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg ring-1 ring-white/20">
                   Mini-OSCE
                 </span>
              )}
            </div>
          </div>

          {/* Lecture Count Badge */}
          <div className="absolute top-4 left-6">
             <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
                <BookOpen className="h-3 w-3 text-white/80" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{course.subjects_count} Lectures</span>
             </div>
          </div>

          <div className="absolute bottom-6 left-8 right-8">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-lg">
              {displayName}
            </h3>
          </div>
        
        {isAdmin && (
          <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
            <button 
              onClick={(e) => handleToggleStatus(e, course.id, Boolean(course.active))}
              className={`p-2.5 rounded-xl backdrop-blur-md text-white transition-all ${
                Boolean(course.active) ? "bg-blue-500/80 hover:bg-blue-600" : "bg-teal-500/80 hover:bg-teal-600"
              }`}
              title={Boolean(course.active) ? "Bring back to staging" : "Activate course"}
            >
              {Boolean(course.active) ? <RotateCcw className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      <div className="px-8 pb-8 flex-1 flex flex-col justify-between space-y-6">
        {/* Main Stats Summary */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-50">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Kitchen</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{course.kitchen_total}</p>
           </div>
           <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unclassified</p>
              <p className="text-3xl font-black text-[#D99450] tracking-tighter">{course.kitchen_unclassified}</p>
           </div>
        </div>

        {/* Detailed Breakdown (Mid vs Final) */}
        <div className="grid grid-cols-1 gap-3">
          {/* Mid Breakdown */}
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" />
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Mid</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-slate-900">{course.mid_total} in kitchen</span>
                  <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">({course.mid_unclassified} unclassified)</span>
               </div>
            </div>
          </div>

          {/* Final Breakdown */}
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Final</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-slate-900">{course.final_total} in kitchen</span>
                  <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">({course.final_unclassified} unclassified)</span>
               </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-4 pt-2">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div 
              className="h-full bg-[#D99450] rounded-full transition-all duration-1000 shadow-lg"
              style={{ width: `${course.kitchen_percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between pl-1">
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D99450] animate-pulse" />
              {course.kitchen_percentage}% Ready
            </span>
            <div className="bg-slate-50 group-hover:bg-[#D99450] p-2 rounded-xl transition-all group-hover:shadow-lg group-hover:shadow-orange-100">
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className="space-y-16">
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight tracking-tight uppercase">Kitchen Dashboard</h2>
            <p className="text-slate-500 font-medium">Manage your staging courses and classify questions.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Create Card - Only for Admins */}
          {isAdmin && (
            <div className="group bg-[#0F172A] p-2 rounded-[32px] shadow-2xl border border-slate-800 flex flex-col gap-2 overflow-hidden min-h-[400px]">
              {/* Image Area */}
              <div 
                className="flex-1 bg-[#E7E0D4] rounded-[24px] relative flex flex-center cursor-pointer hover:bg-[#DDD5C9] transition-colors overflow-hidden group/upload"
                onClick={() => document.getElementById('course-image-input')?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="m-auto flex flex-col items-center gap-4">
                    <UploadCloud className="h-16 w-16 text-[#DDD5C9] group-hover/upload:text-[#CBBFAF] transition-transform group-hover/upload:scale-110" />
                  </div>
                )}
                <input 
                  id="course-image-input"
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              {/* Form Area */}
              <div className="p-3 space-y-2">
                <input 
                  type="text" 
                  placeholder="Name"
                  className="w-full h-12 bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 text-center font-bold text-[#0F172A] outline-none focus:ring-2 focus:ring-orange-500/20"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                />
                <Button 
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="w-full h-12 bg-[#D99450] hover:bg-[#C98440] text-[#0F172A] font-black rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-black/20 disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                </Button>
              </div>
            </div>
          )}

          {stagingCourses.map(course => renderCourseCard(course))}
        </div>
      </div>

      {activeCourses.length > 0 && (
        <div className="space-y-10 animate-in fade-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-50 px-6 text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Activated Courses</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeCourses.map(course => renderCourseCard(course))}
          </div>
        </div>
      )}
    </div>
  )
}

/* Placeholder Views - To be implemented next */
function ImportMCQDialog({ courseId, onSuccess, selectedPeriod }: any) {
  const [importText, setImportText] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    if (!importText.trim()) return
    setIsImporting(true)
    try {
      const blocks = importText.split(/(?:^|\n|>)\s*(?=Q\)|<b>Q\)|<span>Q\))/i).filter(b => b.trim().length > 5)
      
      if (blocks.length === 0) {
        toast.error("No raw blocks detected. Check your format.")
        setIsImporting(false)
        return
      }

      toast.info(`Attempting to parse ${blocks.length} blocks...`)

      const parseMCQ = (text: string) => {
        // Clean up entities but PRESERVE newlines
        const workingText = text.replace(/&nbsp;/g, ' ')
        
        // Marker patterns for finding positions
        const qRegex = /(?:^|\s|>)(?:Q\)|<b>Q\)|<span>Q\))/i
        const oRegex = /(?:^|\s|>)(?:O\)|<b>O\)|<span>O\))/gi
        const cRegex = /(?:^|\s|>)(?:C\)|<b>C\)|<span>C\))/gi
        const eRegex = /(?:^|\s|>)(?:E\)|<b>E\)|<span>E\))/gi

        const markers: { type: 'Q' | 'O' | 'C' | 'E', index: number, length: number }[] = []

        // Find ALL Q, O, C, E markers
        let qMatch, oMatch, cMatch, eMatch;
        
        // 1. Find the FIRST E marker to know where explanation starts
        const firstEMatch = /(?:^|\s|>)(?:E\)|<b>E\)|<span>E\))/i.exec(workingText);
        const eStartIndex = firstEMatch ? firstEMatch.index : Infinity;

        // 2. Collect markers, but for O and C, only if they appear BEFORE the explanation
        const firstQ = qRegex.exec(workingText);
        if (firstQ) markers.push({ type: 'Q', index: firstQ.index, length: firstQ[0].length });

        while ((oMatch = oRegex.exec(workingText)) !== null) {
          if (oMatch.index < eStartIndex) {
            markers.push({ type: 'O', index: oMatch.index, length: oMatch[0].length });
          }
        }

        while ((cMatch = cRegex.exec(workingText)) !== null) {
          if (cMatch.index < eStartIndex) {
            markers.push({ type: 'C', index: cMatch.index, length: cMatch[0].length });
          }
        }

        // We only need the first E, or all of them if they are duplicates at start, 
        // but for safety let's just use the first match as the start of 'the' explanation.
        if (firstEMatch) {
          markers.push({ type: 'E', index: firstEMatch.index, length: firstEMatch[0].length });
        }

        // Sort markers by position
        markers.sort((a, b) => a.index - b.index)

        let question = ""
        const options: string[] = []
        let correctIdx = 0
        let explanation = ""

        for (let i = 0; i < markers.length; i++) {
          const current = markers[i]
          const next = markers[i + 1]
          const start = current.index + current.length
          const end = next ? next.index : workingText.length
          const content = workingText.slice(start, end).trim()

          if (current.type === 'Q') question = content
          else if (current.type === 'O') options.push(content)
          else if (current.type === 'C') {
             const m = content.match(/\d+/)
             if (m) correctIdx = parseInt(m[0])
          }
          else if (current.type === 'E') {
            // Append if multiple E markers found (rare, but handles duplicates)
            explanation = explanation ? (explanation + "\n" + content) : content
          }
        }

        return {
          question: question || "Untitled Question",
          explanation,
          options: options.map((opt, i) => ({
            option: opt,
            correct: (i + 1) === correctIdx
          })),
          type_id: 1,
          period_id: selectedPeriod // Apply selected period!
        }
      }

      const questionsData = blocks.map(parseMCQ).filter(q => q.question.trim().length > 3)

      if (questionsData.length === 0) {
        toast.error(`Detected ${blocks.length} blocks, but failed to extract valid questions from them. Ensure markers (Q, O, C, E) are present.`)
        setIsImporting(false)
        return
      }

      const loadingId = toast.loading(`Importing ${questionsData.length} questions...`)

      const res = await fetch("/api/admin/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, questions: questionsData })
      })

      if (res.ok) {
        toast.success(`Successfully imported ${questionsData.length} questions`, { id: loadingId, duration: 5000 })
        setImportText("")
        onSuccess()
      } else {
        const err = await res.json()
        toast.error(err.details || err.error || "Failed to import questions", {
          id: loadingId,
          description: err.stack ? "Check console for full stack trace" : undefined,
          duration: 5000
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsImporting(false)
    }
  }

  const questionCount = importText.split(/(?:^|\n|>)\s*(?=Q\)|<b>Q\)|<span>Q\))/i).filter(b => b.trim().length > 5).length

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

function PoolView({ courseId, questions, subjects, mutate, onStartWorkflow, onEditQuestion }: any) {
  const [isClassifying, setIsClassifying] = useState<number | null>(null)

  const handleUpdate = async (id: number, data: any) => {
    setIsClassifying(id)
    try {
      const res = await fetch(`/api/admin/kitchen/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || "Update failed")
      }
      mutate()
      toast.success(data.status === 'flagged' ? "Question flagged" : "Question updated")
    } catch (e: any) {
      toast.error(e.message)
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
            <div key={q.id} className={`bg-white p-8 rounded-[32px] border ${q.status === 'flagged' ? 'border-red-300 bg-red-50/5' : 'border-slate-200'} shadow-sm hover:border-orange-200 transition-all space-y-6 group`}>
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border italic ${
                      q.status === 'flagged' 
                        ? 'bg-red-50 text-red-600 border-red-100' 
                        : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {q.status === 'flagged' ? 'Flagged' : 'Unclassified'}
                    </span>
                  </div>
                  <p className={`${q.status === 'flagged' ? 'text-red-600' : 'text-slate-800'} font-bold text-lg leading-relaxed`}>#{idx + 1} {q.question}</p>
                  
                  {/* Question Options */}
                  <div className="space-y-3 pl-2">
                     {(q.options || []).map((opt: any, i: number) => {
                       const optText = typeof opt === 'string' ? opt : (opt.option || opt.text || "")
                       const isCorrect = i === q.correct_index
                       return (
                         <div key={i} className="flex items-center gap-4 transition-all">
                           <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                             isCorrect ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-200 bg-white'
                           }`}>
                             {isCorrect && <div className="w-2 h-2 rounded-full bg-green-500" />}
                           </div>
                           <span className={`text-[15px] font-medium leading-relaxed ${isCorrect ? 'text-green-600' : 'text-slate-600'}`}>
                             {optText}
                           </span>
                         </div>
                       )
                     })}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(q.id)}>
                    <X className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-10 px-4 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl font-bold text-xs uppercase tracking-widest" onClick={() => onEditQuestion(idx)}>
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-slate-50">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-11 px-6 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border ${
                    q.status === 'flagged' 
                      ? 'text-red-600 bg-red-50 border-red-200 shadow-sm' 
                      : 'text-slate-300 hover:text-red-500 border-transparent hover:border-red-100 hover:bg-red-50/30'
                  }`}
                  onClick={() => handleUpdate(q.id, { status: q.status === 'flagged' ? 'unclassified' : 'flagged' })}
                >
                  <Flag className={`h-3.5 w-3.5 mr-2 ${q.status === 'flagged' ? 'fill-red-600' : ''}`} />
                  {q.status === 'flagged' ? 'Unflag' : 'Flag for later'}
                </Button>
              </div>
            </div>

          ))
        )}
      </div>
    </div>
  )
}

function LecturesView({ courseId, subjects, draftQuestions, mutateDrafts, mutateSubjects, isAdmin, isInstructor, courseName, mutateCourses, selectedPeriod, setActiveSection }: any) {
  const [newLectureName, setNewLectureName] = useState("")
  const [newLectureDesc, setNewLectureDesc] = useState("")
  const [bulkText, setBulkText] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [mode, setMode] = useState<"single" | "bulk">("single")
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [isActivating, setIsActivating] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editDescValue, setEditDescValue] = useState("")
  const [isSavingDesc, setIsSavingDesc] = useState(false)
  
  // Group questions by subject
  const subjectsWithDrafts = (subjects || []).map((sub: any) => ({
    ...sub,
    questions: (draftQuestions || []).filter((q: any) => q.subject_id == sub.id)
  }))

  const totalDrafts = subjectsWithDrafts.reduce((acc: number, s: any) => acc + s.questions.length, 0)

  const handleActivateQuestion = async (qId: number) => {
    try {
      const res = await fetch(`/api/admin/kitchen/${qId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'active', active: true })
      })
      if (res.ok) {
        toast.success("Question activated!")
        mutateDrafts()
        mutateSubjects()
        mutateCourses()
      } else {
        toast.error("Failed to activate")
      }
    } catch (e) {
      toast.error("Error activating question")
    }
  }

  const handleBulkActivate = async () => {
    if (!confirm(`Are you sure you want to activate all ${totalDrafts} classified questions? They will be moved from the kitchen to the live question bank.`)) return
    
    setIsActivating(true)
    const tid = toast.loading("Activating questions...")
    try {
      const res = await fetch("/api/admin/kitchen/activate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, period_id: selectedPeriod })
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || `Activated ${data.count} questions`, { id: tid, duration: 5000 })
        // Refresh all data
        await Promise.all([
          mutateDrafts?.(),
          mutateSubjects?.(),
          mutateCourses?.()
        ])
      } else {
        throw new Error(data.error || "Failed to activate questions")
      }
    } catch (e: any) {
      toast.error(e.message, { id: tid })
    } finally {
      setIsActivating(false)
    }
  }

  const handleDeactivateAll = async () => {
    if (!confirm("Are you sure you want to move ALL live questions back to the kitchen?")) return
    
    setIsActivating(true)
    const tid = toast.loading("Deactivating questions...")
    try {
      const res = await fetch("/api/admin/kitchen/deactivate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, period_id: selectedPeriod })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || `Deactivated ${data.count} questions`, { id: tid, duration: 5000 })
        await Promise.all([
          mutateDrafts?.(),
          mutateSubjects?.(),
          mutateCourses?.()
        ])
      } else throw new Error(data.error || "Failed to deactivate questions")
    } catch (e: any) {
      toast.error(e.message, { id: tid })
    } finally {
      setIsActivating(false)
    }
  }

  const handleAddLecture = async () => {
    if (!newLectureName.trim()) return
    setIsAdding(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLectureName, description: newLectureDesc })
      })
      if (res.ok) {
        toast.success("Lecture created successfully")
        setNewLectureName("")
        setNewLectureDesc("")
        mutateSubjects()
      } else {
        toast.error("Failed to create lecture")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setIsAdding(false)
    }
  }

  const handleRenameSubject = async () => {
    if (!editNameValue.trim() || !selectedSubjectId) return
    setIsSavingName(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/subjects`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSubjectId, name: editNameValue.trim() })
      })
      if (res.ok) {
        toast.success("Lecture renamed successfully")
        setIsEditingName(false)
        mutateSubjects()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to rename lecture")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setIsSavingName(false)
    }
  }

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("Are you sure? This will permanently delete this lecture and remove all questions from it (unclassifying them).")) return
    try {
      const res = await fetch(`/api/courses/${courseId}/subjects`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        toast.success("Lecture deleted")
        setSelectedSubjectId(null)
        mutateSubjects()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to delete lecture")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return
    setIsAdding(true)
    try {
      const lines = bulkText.split("\n")
      const cleanedLectures = lines
        .map(l => l.trim().replace(/[⬇️⬆️⬅️➡️]/g, '').trim())
        .filter(l => {
          if (!l || l.length < 2) return false
          if (/^\d+(\.\d+)*$/.test(l)) return false
          if (l.toLowerCase().includes("details")) return false
          if (l === "---") return false
          return true
        })

      if (cleanedLectures.length === 0) {
        toast.error("No valid lectures found in the list.")
        setIsAdding(false)
        return
      }

      toast.info(`Processing ${cleanedLectures.length} lectures...`)
      
      let successCount = 0
      let lastError = ""
      for (const name of cleanedLectures) {
        const res = await fetch(`/api/courses/${courseId}/subjects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        })
        if (res.ok) {
          successCount++
        } else {
          const errData = await res.json().catch(() => ({}))
          lastError = errData.error || `Error ${res.status}`
          console.error(`Failed to add lecture "${name}":`, res.status, errData)
        }
      }

      if (successCount === 0 && cleanedLectures.length > 0) {
        toast.error(`Failed to add: ${lastError}`)
      } else {
        toast.success(`Successfully added ${successCount} lectures!`)
      }
      setBulkText("")
      mutateSubjects()
    } catch (e) {
      toast.error("An error occurred during bulk import")
    } finally {
      setIsAdding(false)
    }
  }

  const handleApproveAll = async (subjectId: number) => {
    const qsInSubject = draftQuestions?.filter((q: any) => q.subject_id == subjectId) || []
    try {
      for (const q of qsInSubject) {
        const res = await fetch(`/api/admin/kitchen/${q.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "pending_approval" })
        })
        if (!res.ok) throw new Error(`Failed to approve question ${q.id}`)
      }
      toast.success(`Successfully approved ${qsInSubject.length} questions`)
    } catch (err: any) {
      toast.error(err.message || "Failed to approve all questions")
    } finally {
      mutateDrafts?.()
    }
  }


  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Title and Bulk Activate */}
      {!selectedSubjectId && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Lectures (Classification)</h3>
            <p className="text-slate-500 font-medium text-sm">Review questions moved to specific lectures before they go live.</p>
          </div>
          
          {(isAdmin || isInstructor) && (
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleDeactivateAll} 
                disabled={isActivating}
                variant="outline"
                className="h-12 px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-black uppercase tracking-widest text-xs flex items-center gap-2"
              >
                <ToggleLeft className="h-4 w-4" /> Deactivate All Live
              </Button>
              <Button 
                onClick={handleBulkActivate}
                disabled={isActivating || totalDrafts === 0}
                className={`font-black h-12 px-6 rounded-xl shadow-lg flex items-center gap-2 uppercase tracking-widest text-xs transition-all active:scale-95 ${
                  totalDrafts > 0 
                    ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-100' 
                    : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                {isActivating ? "Activating..." : `Activate All Drafts (${totalDrafts})`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add New Lecture Form */}
      {!selectedSubjectId && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add New Lecture</h3>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button 
              onClick={() => setMode("single")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'single' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
            >
              Single
            </button>
            <button 
              onClick={() => setMode("bulk")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'bulk' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
            >
              Bulk Import
            </button>
          </div>
        </div>

        {mode === "single" ? (
          <div className="space-y-4">
             <input 
              className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:bg-white outline-none transition-all text-slate-700 font-bold placeholder:text-slate-300"
              placeholder="Lecture Name (e.g. Brain Anatomy)"
              value={newLectureName}
              onChange={(e) => setNewLectureName(e.target.value)}
            />
            <textarea 
              className="w-full h-24 p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:bg-white outline-none transition-all text-slate-600 font-medium text-sm placeholder:text-slate-300"
              placeholder="Description (Optional): Helps AI accurately classify questions."
              value={newLectureDesc}
              onChange={(e) => setNewLectureDesc(e.target.value)}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleAddLecture}
                disabled={isAdding || !newLectureName.trim()}
                className="bg-[#94A3B8] hover:bg-slate-500 text-white font-black h-12 px-8 rounded-xl shadow-lg shadow-slate-100 uppercase tracking-widest text-xs"
              >
                {isAdding ? "Adding..." : "Add Lecture"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm font-medium">
              Paste a list of lectures. Numbers (e.g., "01") and "Details" keywords will be ignored automatically.
            </p>
            <textarea 
              className="w-full h-64 p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:bg-white outline-none transition-all text-slate-700 font-mono text-xs leading-relaxed placeholder:text-slate-300"
              placeholder="01&#10;Brain Anomalies&#10;Details&#10;02&#10;Spinal Injuries&#10;Details..."
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleBulkImport}
                disabled={isAdding || !bulkText.trim()}
                className="bg-[#94A3B8] hover:bg-slate-500 text-white font-black h-12 px-8 rounded-xl shadow-lg shadow-slate-100 uppercase tracking-widest text-xs"
              >
                {isAdding ? "Processing..." : "Process List"}
              </Button>
            </div>
          </div>
        )}
        </div>
      )}

      <div className="space-y-8">
        {selectedSubjectId ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-6 duration-700">
             {/* Header Section */}
             <div className="bg-white p-12 rounded-[40px] border border-slate-200 shadow-sm text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-orange-500 to-teal-500" />
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => { setSelectedSubjectId(null); setIsEditingName(false); }}
                    className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-orange-500 uppercase tracking-widest transition-all group"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Back to Lectures
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">
                      <span>Subjects</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-slate-900">{subjects.find((s: any) => s.id == selectedSubjectId)?.subject}</span>
                    </div>
                    {(isAdmin || isInstructor) && (
                      <button 
                        onClick={() => handleDeleteSubject(selectedSubjectId!)}
                        className="text-red-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"
                        title="Delete Lecture"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {isEditingName ? (
                    <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto">
                       <input 
                        className="w-full text-4xl font-black text-center text-slate-900 border-b-2 border-orange-500 bg-transparent outline-none py-2"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubject()
                          if (e.key === 'Escape') setIsEditingName(false)
                        }}
                      />
                      <div className="flex items-center gap-3">
                         <Button 
                          onClick={handleRenameSubject} 
                          disabled={isSavingName}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-black h-10 px-6 rounded-xl uppercase tracking-widest text-[10px]"
                        >
                          {isSavingName ? "Saving..." : "Save"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsEditingName(false)}
                          className="text-slate-400 font-black h-10 px-6 rounded-xl uppercase tracking-widest text-[10px]"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4 group">
                      <h2 className="text-5xl font-black text-slate-900 tracking-tight">{subjects.find((s: any) => s.id == selectedSubjectId)?.subject}</h2>
                      <button 
                        onClick={() => {
                          setIsEditingName(true);
                          setEditNameValue(subjects.find((s: any) => s.id == selectedSubjectId)?.subject || "");
                        }}
                        className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Edit Name"
                      >
                        <Pencil className="h-6 w-6" />
                      </button>
                    </div>
                  )}
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
                    {subjectsWithDrafts.find((s: any) => s.id == selectedSubjectId)?.questions.length || 0} MCQs assigned
                  </p>
                </div>

             </div>

             {/* AI Description Panel */}
             <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <BrainCircuit className="h-4 w-4 text-indigo-400" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Classification Hint</p>
                   <span className="text-[9px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-100 font-black uppercase tracking-widest">Boosts AI Accuracy</span>
                 </div>
                 {!isEditingDesc && (
                   <button
                     onClick={() => {
                       setIsEditingDesc(true);
                       setEditDescValue(subjects.find((s: any) => s.id == selectedSubjectId)?.description || "");
                     }}
                     className="text-xs font-black uppercase text-indigo-500 hover:text-indigo-700 flex items-center gap-1.5 transition-all"
                   >
                     <Pencil className="h-3 w-3" />
                     {subjects.find((s: any) => s.id == selectedSubjectId)?.description ? "Edit" : "Add Description"}
                   </button>
                 )}
               </div>
               {isEditingDesc ? (
                 <div className="space-y-3">
                   <textarea
                     className="w-full h-28 p-4 bg-slate-50 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-700 font-medium text-sm resize-none placeholder:text-slate-300"
                     placeholder="Describe what topics this lecture covers. E.g. 'Hypertension diagnosis, JNC guidelines, antihypertensive drug classes and side effects.'"
                     value={editDescValue}
                     onChange={(e) => setEditDescValue(e.target.value)}
                     autoFocus
                   />
                   <div className="flex items-center gap-2 justify-end">
                     <Button
                       variant="ghost"
                       onClick={() => setIsEditingDesc(false)}
                       className="text-slate-400 font-black h-9 px-4 rounded-xl uppercase tracking-widest text-[9px]"
                     >
                       Cancel
                     </Button>
                     <Button
                       disabled={isSavingDesc}
                       onClick={async () => {
                         setIsSavingDesc(true);
                         try {
                           const res = await fetch(`/api/courses/${courseId}/subjects`, {
                             method: "PUT",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({ id: selectedSubjectId, description: editDescValue })
                           });
                           if (res.ok) {
                             toast.success("AI description saved");
                             setIsEditingDesc(false);
                             mutateSubjects();
                           } else {
                             toast.error("Failed to save description");
                           }
                         } catch { toast.error("Error saving description"); }
                         finally { setIsSavingDesc(false); }
                       }}
                       className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-9 px-5 rounded-xl uppercase tracking-widest text-[9px]"
                     >
                       {isSavingDesc ? "Saving..." : "Save Description"}
                     </Button>
                   </div>
                 </div>
               ) : (
                 <p className={`text-sm font-medium leading-relaxed ${
                   subjects.find((s: any) => s.id == selectedSubjectId)?.description
                     ? 'text-slate-600'
                     : 'text-slate-300 italic'
                 }`}>
                   {subjects.find((s: any) => s.id == selectedSubjectId)?.description || "No description yet. Click 'Add Description' above to help the AI classify questions more precisely."}
                 </p>
               )}
             </div>

             <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight ml-2">Preview</h3>
                <div className="grid gap-8">
                  {subjectsWithDrafts.find((s: any) => s.id == selectedSubjectId)?.questions.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No questions assigned to this lecture yet.</p>
                    </div>
                  ) : (
                    subjectsWithDrafts.find((s: any) => s.id == selectedSubjectId)?.questions.map((q: any, idx: number) => (
                      <KitchenQuestionCard 
                        key={q.id} 
                        question={q} 
                        index={idx} 
                        isAdmin={isAdmin}
                        isInstructor={isInstructor}
                        onEdit={() => setEditingQuestion(q)}
                        onActivate={() => handleActivateQuestion(q.id)}
                        onDelete={async () => {
                          if (confirm("Permanently delete this question?")) {
                            await fetch(`/api/admin/kitchen/${q.id}`, { method: "DELETE" })
                            mutateDrafts()
                            toast.success("Question deleted")
                          }
                        }}
                      />
                    ))
                  )}
                </div>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {subjectsWithDrafts.length === 0 ? (
              <div className="md:col-span-full text-center py-24 bg-white rounded-[40px] border border-slate-200 border-dashed">
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No lectures created yet.</p>
                <p className="text-slate-400 text-xs mt-2 font-medium">Add your first lecture above to get started.</p>
              </div>
            ) : (
              subjectsWithDrafts.map((sub: any) => (
                <div 
                  key={sub.id} 
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`p-8 rounded-[32px] border transition-all group cursor-pointer relative overflow-hidden ${
                    sub.is_restricted 
                      ? 'bg-red-50/50 border-red-200 shadow-sm hover:border-red-400 hover:shadow-red-500/5' 
                      : 'bg-white border-slate-200 shadow-sm hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5'
                  }`}
                >
                  {sub.is_restricted && (
                    <div className="absolute top-0 right-0 px-4 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">
                      AI Restricted
                    </div>
                  )}
                  <div className="space-y-1 flex-1 min-h-[40px]">
                    <h4 className={`font-black text-lg uppercase tracking-tight transition-colors leading-tight ${
                      sub.is_restricted ? 'text-red-700 group-hover:text-red-800' : 'text-slate-800 group-hover:text-orange-600'
                    }`}>{sub.subject}</h4>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${
                      sub.is_restricted ? 'text-red-400' : 'text-slate-400'
                    }`}>{sub.questions.length || 0} Questions</p>
                    {sub.description ? (
                      <p className="text-xs text-slate-400 font-medium leading-snug pt-1 line-clamp-2">{sub.description}</p>
                    ) : (
                      <p className="text-[9px] text-slate-300 uppercase tracking-widest pt-1 italic">No AI description — click → to add</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100/50">
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        const newStatus = !sub.is_restricted;
                        const tid = toast.loading(newStatus ? "Restricting AI..." : "Removing restriction...");
                        try {
                          const res = await fetch(`/api/courses/${courseId}/subjects`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: sub.id, is_restricted: newStatus })
                          });
                          if (res.ok) {
                            toast.success(newStatus ? "Subject restricted from AI" : "Restriction removed", { id: tid });
                            mutateSubjects();
                          } else {
                            toast.error("Failed to update status", { id: tid });
                          }
                        } catch (err) {
                          toast.error("Error updating status", { id: tid });
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                        sub.is_restricted 
                          ? 'bg-red-100 border-red-200 text-red-600 hover:bg-red-200' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100'
                      }`}
                    >
                      {sub.is_restricted ? <LockIcon className="h-3 w-3" /> : <UnlockIcon className="h-3 w-3" />}
                      {sub.is_restricted ? "Unrestrict Classify" : "Restrict from Classify"}
                    </button>
                    <div className={`p-2.5 rounded-xl transition-all group-hover:translate-x-1 ${
                      sub.is_restricted ? 'bg-red-100 group-hover:bg-red-500' : 'bg-slate-50 group-hover:bg-orange-500'
                    }`}>
                        <ArrowRight className={`h-4 w-4 transition-colors ${
                          sub.is_restricted ? 'text-red-400 group-hover:text-white' : 'text-slate-400 group-hover:text-white'
                        }`} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Editing Dialog */}
      {editingQuestion && (
        <QuestionEditDialog 
          question={editingQuestion} 
          onClose={() => setEditingQuestion(null)}
          subjects={subjects}
          onSave={async (updatedData: any) => {
            const res = await fetch(`/api/admin/kitchen/${editingQuestion.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedData)
            })
            if (res.ok) {
              toast.success("Question updated successfully!")
              mutateDrafts()
              setEditingQuestion(null)

              // Redirect to pool if unclassified
              if (!updatedData.subject_id || updatedData.status === 'unclassified') {
                setActiveSection("pool")
              }
            } else {
              const err = await res.json()
              toast.error(err.details || err.error || "Failed to update")
            }
          }}
        />
      )}
    </div>
  )
}

/* --- Premium Question Card Component --- */
function KitchenQuestionCard({ question, index, onEdit, onDelete, onActivate, isAdmin, isInstructor }: any) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-md transition-shadow">
      {/* Top Header */}
      <div className="px-10 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
         <span className="text-slate-400 font-bold text-sm tracking-tight flex items-center gap-3">
           Case #{index + 1}
           {question.active === false && (
             <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
               Deactivated
             </span>
           )}
         </span>
         <div className="flex items-center gap-6">
           {(isAdmin || isInstructor) && (
             <button 
               onClick={onActivate} 
               title="Activate Question"
               className="flex items-center gap-1.5 text-teal-600 font-black text-[10px] uppercase tracking-widest hover:bg-teal-50 px-3 py-1.5 rounded-xl transition-all border border-transparent hover:border-teal-100"
             >
               <CheckCircle className="h-3.5 w-3.5" />
               Activate
             </button>
           )}
           <button onClick={onEdit} className="text-[#6366F1] font-bold text-[10px] uppercase tracking-widest hover:underline">Edit</button>
           <button onClick={onDelete} title="Delete Permanently" className="text-red-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-4 w-4" />
           </button>
         </div>
      </div>

      <div className="p-10 space-y-8">
        {/* Question Content */}
        <div className="space-y-6">
           <div className="prose prose-slate max-w-none">
             <h3 className="text-[19px] font-bold text-[#1E293B] leading-snug tracking-tight" dangerouslySetInnerHTML={{ __html: question.question }} />
           </div>

           {/* Options List */}
           <div className="space-y-3">
              {(question.options || []).map((opt: any, i: number) => {
                const optText = typeof opt === 'string' ? opt : (opt.option || opt.text || "")
                const isCorrect = i === question.correct_index
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`mt-1.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${isCorrect ? 'border-green-500 bg-green-500' : 'border-slate-300'}`}>
                      {isCorrect && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <p className={`text-[16px] font-medium leading-relaxed ${isCorrect ? 'text-green-600' : 'text-slate-600'}`}>
                      {optText}
                    </p>
                  </div>
                )
              })}
           </div>
        </div>

        {/* Explanation Section */}
        {question.explanation && (
          <div className="bg-[#F8FAFC] rounded-[24px] overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="px-6 py-2.5 bg-slate-200/50 inline-block rounded-br-2xl">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Explanation</span>
             </div>
             <div className="p-8 prose prose-slate max-w-none">
                <div 
                  className="text-[15px] font-medium text-slate-700 leading-relaxed" 
                  dangerouslySetInnerHTML={{ __html: question.explanation }} 
                />
             </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* --- Robust Question Edit Dialog --- */
function QuestionEditDialog({ question, onClose, onSave, subjects }: any) {
  const [editData, setEditData] = useState({
    question: question.question,
    options: question.options || ["", "", "", ""],
    correct_index: question.correct_index || 0,
    explanation: question.explanation || "",
    subject_id: question.subject_id,
    period_id: question.period_id || 2,
    status: question.status || 'unclassified'
  })
  const [showQPreview, setShowQPreview] = useState(false)
  const [showEPreview, setShowEPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editData)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit MCQ</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">HTML Preview Enabled</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        {/* Relocation & Period Section */}
        <div className="px-10 py-4 border-b border-slate-100 bg-orange-50/30 flex items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-4 flex-1">
             <span className="text-[10px] font-black uppercase text-orange-600 tracking-widest whitespace-nowrap">Relocate to</span>
             <select 
               className="flex-1 max-w-sm h-10 px-4 bg-white border border-orange-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
               value={editData.subject_id || ""}
               onChange={(e) => setEditData({ ...editData, subject_id: Number(e.target.value) })}
             >
               <option value="" disabled>Select a lecture...</option>
               {(subjects || []).filter((s: any) => !s.is_restricted).map((s: any) => (
                 <option key={s.id} value={s.id}>{s.subject}</option>
               ))}
             </select>
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setEditData({ ...editData, subject_id: null, status: 'unclassified' })}
               className="h-10 px-4 text-orange-600 hover:bg-orange-100 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-orange-100 border-dashed"
             >
               Move to Pool
             </Button>
          </div>          
          <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-orange-100 shadow-sm">
            <button 
              onClick={() => setEditData({ ...editData, period_id: 1 })}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editData.period_id === 1 ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Mid
            </button>
            <button 
              onClick={() => setEditData({ ...editData, period_id: 2 })}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editData.period_id === 2 ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Final
            </button>
          </div>

          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-100">
             Current Status: Classified
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12">
          {/* Question Text */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Content</p>
              <button 
                onClick={() => setShowQPreview(!showQPreview)}
                className="text-xs font-black uppercase text-orange-600 hover:text-orange-700 transition-all flex items-center gap-2"
              >
                {showQPreview ? <><Code className="h-4 w-4" /> Edit Code</> : <><ImageIcon className="h-4 w-4" /> Preview</>}
              </button>
            </div>
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 overflow-hidden min-h-[160px] shadow-inner">
              {showQPreview ? (
                <div className="p-8 bg-white prose prose-slate max-w-none">
                  <div className="text-xl font-bold text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: editData.question }} />
                </div>
              ) : (
                <textarea 
                  className="w-full h-40 p-8 bg-slate-50 border-none outline-none text-slate-800 font-mono text-sm leading-relaxed scrollbar-hide"
                  value={editData.question}
                  onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                  placeholder="Enter question HTML..."
                />
              )}
            </div>
          </div>

          {/* Options Section */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Options Management</p>
            <div className="grid gap-3">
              {editData.options.map((opt: string, i: number) => (
                <div key={i} className={`flex items-center gap-5 bg-white border ${editData.correct_index === i ? 'border-green-500 bg-green-50/10' : 'border-slate-100'} p-5 rounded-[24px] hover:border-slate-200 transition-all group`}>
                  <button 
                    onClick={() => setEditData({ ...editData, correct_index: i })}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${editData.correct_index === i ? 'border-green-500 bg-green-500 shadow-lg shadow-green-100' : 'border-slate-200 hover:border-green-200'}`}
                  >
                    {editData.correct_index === i && <Check className="h-4 w-4 text-white stroke-[4px]" />}
                  </button>
                  <input 
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...editData.options]
                      newOpts[i] = e.target.value
                      setEditData({ ...editData, options: newOpts })
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] font-bold text-slate-700 placeholder:text-slate-300"
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Explanation (Rich Content)</p>
              <button 
                onClick={() => setShowEPreview(!showEPreview)}
                className="text-xs font-black uppercase text-orange-600 hover:text-orange-700 transition-all flex items-center gap-2"
              >
                {showEPreview ? <><Code className="h-4 w-4" /> Edit Code</> : <><ImageIcon className="h-4 w-4" /> Preview</>}
              </button>
            </div>
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 overflow-hidden min-h-[200px] shadow-inner">
              {showEPreview ? (
                <div className="p-8 bg-white prose prose-slate max-w-none">
                  <div className="text-[15px] font-medium text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: editData.explanation || '<p class="italic text-slate-400">No explanation content yet...</p>' }} />
                </div>
              ) : (
                <textarea 
                  className="w-full h-64 p-8 bg-slate-50 border-none outline-none text-slate-800 font-mono text-sm leading-relaxed"
                  value={editData.explanation}
                  onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                  placeholder="Enter explanation HTML..."
                />
              )}
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4 shrink-0">
          <Button variant="ghost" onClick={onClose} className="font-bold text-slate-400 hover:text-slate-600 h-14 px-8 rounded-2xl">Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#0F172A] hover:bg-slate-900 text-white font-black px-12 h-14 rounded-2xl shadow-2xl shadow-slate-200 uppercase tracking-widest text-xs flex items-center gap-3"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}


function FlaggedView({ courseId, onEdit }: { courseId: number, onEdit: (id: number) => void }) {
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
            <div key={q.id} className="bg-white p-8 rounded-[32px] border border-red-200 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100 italic">
                      Flagged for later
                    </span>
                  </div>
                  <p className="text-red-700 font-bold text-lg leading-relaxed">{idx + 1}. {q.question}</p>
                  
                  {/* Options Preview */}
                  <div className="space-y-3 pl-2">
                     {(q.options || []).map((opt: any, i: number) => {
                       const optText = typeof opt === 'string' ? opt : (opt.option || opt.text || "")
                       const isCorrect = i === q.correct_index
                       return (
                         <div key={i} className="flex items-center gap-4">
                           <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                             isCorrect ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-200 bg-white'
                           }`}>
                             {isCorrect && <div className="w-2 h-2 rounded-full bg-green-500" />}
                           </div>
                           <span className={`text-[15px] font-medium leading-relaxed ${isCorrect ? 'text-green-600' : 'text-slate-600'}`}>
                             {optText}
                           </span>
                         </div>
                       )
                     })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-10 px-4 text-orange-500 hover:bg-orange-50 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2" 
                    onClick={() => onEdit(q.id)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AllQuestionsView({ courseId, setActiveSection, subjects, mutatePool, mutateDrafts }: any) {
  const { data: questions, mutate } = useSWR<KitchenQuestion[]>(
    courseId ? `/api/admin/kitchen?course_id=${courseId}` : null
  )
  const [editingQuestion, setEditingQuestion] = useState<any>(null)

  const handleUpdate = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/admin/kitchen/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || "Update failed")
      }
      mutate()
      mutatePool?.()
      mutateDrafts?.()
      toast.success(data.status === 'flagged' ? "Question flagged" : "Question updated")
    } catch (e: any) {
      toast.error(e.message)
    }
  }

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
              <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {questions?.map((q: any, idx: number) => (
              <tr key={q.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-5 font-black text-slate-300 text-[10px]">#{idx + 1}</td>
                <td className={`px-8 py-5 font-bold max-w-xs ${q.status === 'flagged' ? 'text-red-600' : 'text-slate-700'}`}>{q.question.replace(/<[^>]*>/g, '').substring(0, 100)}...</td>
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
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 w-8 p-0 rounded-lg transition-all ${q.status === 'flagged' ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                      onClick={() => handleUpdate(q.id, { status: q.status === 'flagged' ? (q.subject_id ? 'draft' : 'unclassified') : 'flagged' })}
                    >
                      <Flag className={`h-3.5 w-3.5 ${q.status === 'flagged' ? 'fill-red-500' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                      onClick={() => setEditingQuestion(q)}
                    >
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingQuestion && (
        <QuestionEditDialog 
          question={editingQuestion} 
          onClose={() => setEditingQuestion(null)}
          subjects={subjects}
          onSave={async (updatedData: any) => {
            const res = await fetch(`/api/admin/kitchen/${editingQuestion.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedData)
            })
            if (res.ok) {
              toast.success("Question updated successfully!")
              mutate()
              mutatePool?.()
              mutateDrafts?.()
              setEditingQuestion(null)
              
              // Handle redirect to pool if unclassified
              if (!updatedData.subject_id || updatedData.status === 'unclassified') {
                setActiveSection("pool")
              }
            } else {
              const err = await res.json()
              toast.error(err.details || err.error || "Failed to update")
            }
          }}
        />
      )}
    </div>
  )
}


function WorkflowView({ 
  courseId,
  questions, 
  subjects, 
  mutate,         // mutatePool (unclassified)
  mutateDrafts,   // mutateDrafts (classified)
  mutateSubjects, // update subject counts
  mutateCourses,  // update main dashboard counts
  onClose, 
  courseName, 
  initialIndex = 0 
}: any) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isSaving, setIsSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [lastAction, setLastAction] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [showQuestionPreview, setShowQuestionPreview] = useState(true)
  const [processedIds, setProcessedIds] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const LastActionNotification = ({ action, onUndo }: any) => {
    if (!action) return null;
    return (
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="bg-[#0F172A] rounded-[24px] flex items-center justify-between gap-10 px-8 py-5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-slate-700/50 backdrop-blur-xl">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Undo Action Available</p>
            <p className="text-white text-[15px] font-bold leading-none">
              Moved to <span className="text-orange-400">{action.subjectName}</span>
            </p>
          </div>
          <button 
            onClick={() => {
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
              onUndo();
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl h-11 px-6 flex items-center gap-2 text-xs uppercase transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <RotateCcw className="h-4 w-4" />
            Undo Now
          </button>
        </div>
      </div>
    );
  };

  // Filter out questions that have already been processed in this session
  const remainingQuestions = (questions || []).filter((q: any) => !processedIds.has(q.id))
  
  // The current question is based on the remaining pool and the user's skip index
  const q = remainingQuestions[currentIndex]
  const [editData, setEditData] = useState<any>(null)

  useEffect(() => {
    if (q) {
      const clean = (text: string) => {
        if (!text) return "";
        return text
          .replace(/\[cite_start\]/gi, "")
          .replace(/\[cite:.*?\]/gi, "")
          .trim();
      };

      setEditData({
        question: clean(q.question),
        options: (q.options || ["", "", "", ""]).map((opt: any) => 
          typeof opt === 'string' ? clean(opt) : clean(opt.option || "")
        ),
        correct_index: q.correct_index || 0,
        explanation: clean(q.explanation || ""),
        subject_id: q.subject_id,
        period_id: q.period_id || 2
      })
    } else {
      setEditData(null)
    }
  }, [q])

  if (remainingQuestions.length === 0) {
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

  // Handle case where currentIndex might be out of range after a move
  if (!q && remainingQuestions.length > 0) {
    if (currentIndex > 0) {
      setCurrentIndex(Math.max(0, remainingQuestions.length - 1))
      return null // Wait for re-render
    }
  }

  if (!q || !editData) return null; // Loading state

  const handleUpdate = async (data: any, next = true) => {
    const prevSubjectId = q.subject_id;
    const effectiveSubjectId = data.subject_id || editData.subject_id;
    setIsSaving(true);
    setIsTransitioning(true);
    
    try {
      // Mark as processed immediately for seamless transition
      const processedId = q.id;
      
      const res = await fetch(`/api/admin/kitchen/${processedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...editData, 
          ...data,
          status: data.status || "draft" // Default to draft when classified
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Server Error Details:", errorData);
        throw new Error(`Failed to move question: ${errorData.details || errorData.error || res.statusText}`);
      }

      setProcessedIds(prev => new Set(prev).add(processedId))

      if (effectiveSubjectId) {
        const subjectName = subjects.find((s: any) => s.id === Number(effectiveSubjectId))?.subject || "Unknown";
        
        // Clear any existing timer to prevent early vanishing
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        
        setLastAction({
          questionId: processedId,
          prevSubjectId: prevSubjectId,
          subjectName: subjectName
        });

        // Set new timer for 15s
        undoTimerRef.current = setTimeout(() => {
          setLastAction(null);
          undoTimerRef.current = null;
        }, 15000);
      }

      // If we are at the last question of the remaining pool (excluding what we just moved)
      // and we want to go 'next', but there's nothing left, we stay at current index 
      // which will catch the 'remaining.length === 0' in the render
      if (next) {
        // If we processed an item and we were at the end of the skip list, 
        // we might want to move back if the pool is now smaller than our index
        if (currentIndex >= remainingQuestions.length - 1) {
          setCurrentIndex(Math.max(0, remainingQuestions.length - 2))
        }
      }

      // Refresh SWR in background
      mutate?.();
      mutateDrafts?.();
      mutateSubjects?.();
      mutateCourses?.();

    } catch (error: any) {
       console.error("Update failed:", error)
       toast.error(error.message || "Failed to move question")
    } finally {
      setIsSaving(false)
      // Longer buffer to ensure SWR has time to trigger re-render 
      // and UI is blocked while the next question loads
      setTimeout(() => setIsTransitioning(false), 700)
    }
  }

  const handleUndo = async () => {
    if (!lastAction) return;
    setIsSaving(true);
    try {
      await fetch(`/api/admin/kitchen/${lastAction.questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: lastAction.prevSubjectId, status: 'unclassified' })
      });
      setProcessedIds(prev => {
        const next = new Set(prev);
        next.delete(lastAction.questionId);
        return next;
      });
      
      // Calculate where it will be in the list
      const restoredId = lastAction.questionId;
      const newRemaining = (questions || []).filter((q: any) => q.id === restoredId || !processedIds.has(q.id));
      const newIdx = newRemaining.findIndex((q: any) => q.id === restoredId);
      if (newIdx !== -1) setCurrentIndex(newIdx);

      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setLastAction(null);
      undoTimerRef.current = null;
      mutate();
      toast.success("Action undone successfully");
    } catch (error) {
      toast.error("Failed to undo action");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Interaction Overlay - Prevents clicks during transitions and AI analysis */}
      {(isTransitioning || isSaving || isAnalyzing) && (
        <div className="fixed inset-0 top-16 z-40 bg-slate-900/40 backdrop-blur-sm cursor-wait flex items-center justify-center animate-in fade-in duration-300">
            <div className="bg-[#1e293b] text-white px-10 py-8 rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.6)] border border-slate-700/50 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
               <div className="relative">
                 <div className="h-14 w-14 rounded-full border-4 border-slate-800 border-t-orange-500 animate-spin" />
                 <BrainCircuit className="h-6 w-6 text-orange-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
               </div>
               <div className="text-center space-y-2">
                 <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500 mb-1">
                   {isAnalyzing ? "AI Reasoning" : "Finalizing Move"}
                 </p>
                 <p className="text-base font-bold text-slate-200">
                   {isAnalyzing ? "Identifying clinical patterns..." : "Updating your question bank..."}
                 </p>
                 <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Please hold on a moment</p>
               </div>
            </div>
        </div>
      )}

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
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-10 px-4 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border ${
                  q.status === 'flagged'
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : 'text-slate-400 hover:text-red-500 hover:bg-red-50 border-transparent'
                }`} 
                onClick={async () => {
                  const newStatus = q.status === 'flagged' ? 'unclassified' : 'flagged';
                  setIsSaving(true);
                  try {
                    const res = await fetch(`/api/admin/kitchen/${q.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: newStatus })
                    });
                    if (res.ok) {
                      mutate(); // Refresh the pool
                      toast.success(newStatus === 'flagged' ? "Flagged for later" : "Unflagged");
                    }
                  } catch (e) {
                    toast.error("Failed to update flag");
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                <Flag className={`h-3 w-3 mr-1.5 ${q.status === 'flagged' ? 'fill-red-600' : ''}`} />
                {q.status === 'flagged' ? 'Flagged' : 'Flag'}
              </Button>
              <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest italic pt-0.5">
                {questions.length - currentIndex} Remaining
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Text</p>
                  <button 
                     onClick={() => setShowQuestionPreview(!showQuestionPreview)}
                     className="text-[10px] font-black uppercase text-secondary hover:text-secondary/80 transition-all flex items-center gap-1.5"
                   >
                     {showQuestionPreview ? (
                       <>
                         <Code className="h-3 w-3" />
                         Switch to Edit Code
                       </>
                     ) : (
                       <>
                         <ImageIcon className="h-3 w-3" />
                         Switch to Preview
                       </>
                     )}
                   </button>
                </div>
                {showQuestionPreview ? (
                  <div className="w-full min-h-[120px] p-6 bg-white border border-slate-100 rounded-2xl prose prose-slate max-w-none overflow-y-auto">
                    <div 
                      className="text-lg font-bold text-slate-800 leading-relaxed" 
                      dangerouslySetInnerHTML={{ __html: editData.question }} 
                    />
                  </div>
                ) : (
                  <textarea 
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:bg-white outline-none transition-all text-slate-800 font-medium text-sm leading-relaxed"
                    value={editData.question}
                    onChange={(e) => setEditData({ ...editData, question: e.target.value })} 
                  />
                )}
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
                  <button 
                     onClick={() => setShowPreview(!showPreview)}
                     className="text-[10px] font-black uppercase text-secondary hover:text-secondary/80 transition-all flex items-center gap-1.5"
                   >
                     {showPreview ? (
                       <>
                         <Code className="h-3 w-3" />
                         Switch to Edit Code
                       </>
                     ) : (
                       <>
                         <ImageIcon className="h-3 w-3" />
                         Switch to Preview
                       </>
                     )}
                   </button>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden flex flex-col min-h-[160px]">
                   {showPreview ? (
                     <div className="flex-1 p-6 bg-white prose prose-slate max-w-none overflow-y-auto">
                       <div 
                         className="text-sm font-medium text-slate-700 leading-relaxed" 
                         dangerouslySetInnerHTML={{ __html: editData.explanation || '<p class="text-slate-400 italic font-bold uppercase tracking-widest text-[10px]">No explanation content yet...</p>' }} 
                       />
                     </div>
                   ) : (
                     <textarea 
                       className="w-full h-40 p-4 bg-slate-50 border-none rounded-2xl focus:ring-0 outline-none transition-all text-slate-800 font-mono text-sm leading-relaxed"
                       value={editData.explanation}
                       onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                       placeholder="Write or paste explanation HTML here..."
                     />
                   )}
                </div>
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
              disabled={isSaving || isAnalyzing}
            >
              {isSaving ? "Saving..." : "Save & Next"}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Classification */}
      <div className="lg:col-span-1 space-y-4">
         <div className="bg-white rounded-[32px] border border-slate-200 p-6 space-y-6 sticky top-24">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Type</p>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setEditData({ ...editData, period_id: 1 })}
                  className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editData.period_id === 1 ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Mid
                </button>
                <button 
                  onClick={() => setEditData({ ...editData, period_id: 2 })}
                  className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editData.period_id === 2 ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Final
                </button>
              </div>
            </div>

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classify to Lecture</p>
            
             <Button 
              className={`w-full h-14 font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs transition-all duration-300 ${
                isAnalyzing 
                  ? "bg-[#9333EA] text-white shadow-indigo-200" 
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white shadow-indigo-100"
              }`}
              disabled={isAnalyzing || isSaving || isTransitioning}
              onClick={async () => {
                if (isAnalyzing || isSaving || isTransitioning) return;
                setIsAnalyzing(true)
                setIsTransitioning(true)
                const toastId = toast.loading("AI is analyzing the question...")
                try {
                  // Using the Server Action as requested by the architectural blueprint
                  const data = await suggestCategoryAction(
                    editData.question,
                    editData.explanation,
                    editData.options,
                    courseId,
                    courseName
                  )

                  if (data.success && data.lectureId > 0) {
                    // Success matched - show message and move it
                    toast.success(`AI Matched: ${data.reasoning}`, { id: toastId, duration: 8000 })
                    
                    // The move operation itself might fail, so we don't catch handleUpdate errors here 
                    // to prevent double-toast (handleUpdate has its own toast)
                    await handleUpdate({ 
                      subject_id: data.lectureId, 
                      status: 'draft' 
                    }).catch(() => {
                      // handleUpdate already showed its toast, just finish here
                    })
                  } else {
                    toast.error(`AI Decision: ${data.reasoning || "Could not classify accurately"}`, { id: toastId, duration: 10000 })
                  }
                } catch (e: any) {
                  // This catches suggestCategoryAction crashes or network failures
                  console.error("AI Auto-Classify Error:", e)
                  const msg = e.message || "An unexpected response was received from the server."
                  toast.error(`AI Error: ${msg}`, { id: toastId, duration: 10000 })
                } finally {
                  setIsAnalyzing(false)
                  setTimeout(() => setIsTransitioning(false), 300)
                }
              }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  ✨ AI Auto-Classify
                </>
              )}
            </Button>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                placeholder="Search lectures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {subjects
                .filter((s: any) => {
                  if (s.is_restricted) return false;
                  const name = (s.subject || "").toLowerCase();
                  return name.includes(searchTerm.toLowerCase());
                })
                .map((s: any, entryIdx: number) => (
                <button 
                  key={s.id}
                  onClick={() => {
                    setEditData({ ...editData, subject_id: s.id })
                    handleUpdate({ subject_id: s.id, status: 'draft' })
                  }}
                  style={{ animationDelay: `${entryIdx * 30}ms` }}
                  className={`w-full text-left p-4 rounded-xl border transition-all group flex items-center justify-between animate-in fade-in slide-in-from-right-4 fill-mode-both ${editData.subject_id === s.id ? 'border-orange-200 bg-orange-50' : 'border-slate-50 hover:border-orange-100 hover:bg-slate-50'}`}
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
    <LastActionNotification action={lastAction} onUndo={handleUndo} />
    </>
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
