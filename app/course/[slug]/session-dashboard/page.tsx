"use client"

import { use, useState, useCallback, useEffect, useRef, useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Home, ChevronRight, Clock, Hash, RotateCcw, Loader2,
  CheckSquare, Square, ChevronDown, ChevronLeft, Flag,
  Eye, EyeOff, Send, AlertCircle, Lock, BookOpen, FileText, Timer
} from "lucide-react"

// Global SWRProvider handles fetching and caching rules.

// ─── Types ────────────────────────────────────────────────────────────────────
interface DBSubject { id: number; name: string; question_count: string | number; mid_question_count: string | number; final_question_count: string | number }
interface DBOption { id: number; option: string; correct: boolean; selection_count?: string | number }
interface DBFigure { id: number; image_url: string; figure_type: string | null }
interface DBSubQ { id: number; subquestion_text: string; answer_html: string }
interface DBQuestion {
  id: number; question_text: string | null; explanation_html: string | null;
  subject_id: number; subject_name: string; question_type: string | null; exam_period: string | null;
  options: DBOption[]; figures: DBFigure[]; sub_questions: DBSubQ[]
  _savedAnswerId?: number | null;
  _savedFlagged?: boolean;
}
interface Assessment { id: number; course_name: string; assessment_type: string; date: string; total_questions: string; correct_answers: string }

type Mode = "dashboard" | "study" | "exam" | "session" | "results"

// ─── SubjectSelector ──────────────────────────────────────────────────────────
function SubjectSelector({ subjects, selected, onToggle }: { subjects: DBSubject[]; selected: Set<number>; onToggle: (id: number) => void }) {
  return (
    <div className="max-h-[340px] overflow-y-auto rounded-lg border border-border">
      {subjects.map(s => (
        <button key={s.id} onClick={() => onToggle(s.id)}
          className="flex w-full items-center gap-2 border-b border-border/50 px-3 py-2 text-left transition-colors hover:bg-muted/50">
          {selected.has(s.id) ? <CheckSquare className="h-4 w-4 shrink-0 text-secondary" /> : <Square className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <span className="flex-1 text-sm text-foreground">{s.name}</span>
          <span className="text-xs text-muted-foreground">{s.question_count} Q</span>
        </button>
      ))}
    </div>
  )
}

// ─── OptionButton ─────────────────────────────────────────────────────────────
function OptionBtn({ opt, letter, isSelected, isRevealed, percentage, onClick }: {
  opt: DBOption; letter: string; isSelected: boolean; isRevealed: boolean; percentage?: number; onClick: () => void
}) {
  let cls = "border-border bg-background"
  let pbCls = "bg-muted/30" // Progress bar color

  if (isRevealed) {
    if (opt.correct) {
      cls = "border-green-500 bg-green-500/10"
      pbCls = "bg-green-500/20"
    } else if (isSelected) {
      cls = "border-destructive bg-destructive/10"
      pbCls = "bg-destructive/20"
    }
  } else if (isSelected) cls = "border-secondary bg-secondary/5"

  return (
    <button onClick={onClick} disabled={isRevealed}
      className={`relative overflow-hidden flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${cls} ${isRevealed ? "cursor-default" : "hover:border-secondary/50"}`}>
      {isRevealed && percentage !== undefined && (
        <div className={`absolute inset-y-0 left-0 ${pbCls} transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }} />
      )}
      <div className="relative z-10 flex w-full items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isSelected ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>{letter}</span>
        <span className="flex-1 text-sm text-foreground">{opt.option}</span>
        {isRevealed && percentage !== undefined && (
          <span className="text-sm font-bold opacity-80">{percentage}%</span>
        )}
      </div>
    </button>
  )
}

// ─── QuestionView ─────────────────────────────────────────────────────────────
function QuestionView({ q, selectedId, revealed, onSelect, onReveal, showExplanation, hideSubmit, isExamMode, onNext }: {
  q: DBQuestion; selectedId: number | null; revealed: boolean; onSelect: (id: number) => void; onReveal: () => void; showExplanation: boolean; hideSubmit?: boolean; isExamMode?: boolean; onNext?: () => void;
}) {
  const LETTERS = ["A", "B", "C", "D", "E", "F"]
  const isCBQ = q.sub_questions.length > 0
  const [visibleSubs, setVisibleSubs] = useState<Set<number>>(new Set())
  const [interactedSubs, setInteractedSubs] = useState<Set<number>>(new Set())
  const [explicitlyRevealedExpl, setExplicitlyRevealedExpl] = useState<Set<number>>(new Set())

  if (isCBQ) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border border-border bg-muted/30 p-5">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Case Presentation</h4>
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_th]:bg-[#05223A] [&_th]:text-white [&_th]:px-4 [&_th]:py-3 [&_th]:border [&_th]:border-border [&_td]:px-4 [&_td]:py-3 [&_td]:border [&_td]:border-border" dangerouslySetInnerHTML={{ __html: q.question_text || "" }} />
        </div>
        {q.figures.filter(f => f.figure_type !== 'explanation').length > 0 && (
          <div className="flex flex-wrap gap-3">
            {q.figures.filter(f => f.figure_type !== 'explanation').map(f => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={f.id} src={f.image_url} alt="Question figure" className="max-h-64 rounded-lg border border-border object-contain" />
            ))}
          </div>
        )}
        {q.sub_questions.map((sq, idx) => (
          <div key={sq.id} className="flex flex-col gap-2">
            <div className="flex gap-2 text-sm font-semibold text-foreground">
              <span>{idx + 1})</span>
              <div className="prose prose-sm max-w-none text-foreground font-semibold [&_table]:w-full [&_table]:border-collapse [&_th]:bg-[#05223A] [&_th]:text-white [&_th]:px-4 [&_th]:py-3 [&_th]:border [&_th]:border-border [&_td]:px-4 [&_td]:py-3 [&_td]:border [&_td]:border-border" dangerouslySetInnerHTML={{ __html: sq.subquestion_text }} />
            </div>
            {visibleSubs.has(sq.id) || hideSubmit ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-700 dark:bg-amber-950" dangerouslySetInnerHTML={{ __html: sq.answer_html }} />
                {!hideSubmit && (
                  <button onClick={() => setVisibleSubs(p => { const n = new Set(p); n.delete(sq.id); return n })} className="flex items-center gap-1.5 self-start text-xs font-medium text-primary hover:underline">
                    <EyeOff className="h-3.5 w-3.5" /> Hide Answer
                  </button>
                )}
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => {
                setVisibleSubs(p => new Set(p).add(sq.id));
                setInteractedSubs(p => new Set(p).add(sq.id));
              }} className="self-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Eye className="mr-1.5 h-3.5 w-3.5" /> Show Answer
              </Button>
            )}
          </div>
        ))}
        {(() => {
          if (!showExplanation || !q.explanation_html) return null;
          const allInteracted = q.sub_questions.length > 0 && q.sub_questions.every(sq => interactedSubs.has(sq.id))
          const isExplVisible = hideSubmit || allInteracted || explicitlyRevealedExpl.has(q.id)

          return (
            <div className="mt-2 flex flex-col gap-4">
              {(isExplVisible || selectedId !== null) && onNext && (
                <Button onClick={onNext} className="w-full bg-secondary py-5 text-base font-semibold text-secondary-foreground hover:bg-secondary/90 shadow-lg border-2 border-secondary hover:translate-y-[-2px] transition-transform">
                  Next Question <ChevronRight className="ml-2 h-5 w-5 inline" />
                </Button>
              )}
              {isExplVisible ? (
                <div className="rounded-lg border border-border bg-background p-5 shadow-sm">
                  <h4 className="mb-3 text-base font-bold text-foreground">Explanation:</h4>
                  {q.explanation_html && (
                    <div className="prose prose-sm max-w-none text-foreground mb-4 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-[#05223A] [&_th]:text-white [&_th]:px-4 [&_th]:py-3 [&_th]:border [&_th]:border-border [&_td]:px-4 [&_td]:py-3 [&_td]:border [&_td]:border-border [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-3" dangerouslySetInnerHTML={{ __html: q.explanation_html }} />
                  )}
                  {q.figures.filter(f => f.figure_type === 'explanation').length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {q.figures.filter(f => f.figure_type === 'explanation').map(f => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={f.id} src={f.image_url} alt="Explanation figure" className="max-h-64 rounded-lg border border-border object-contain" />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={() => setExplicitlyRevealedExpl(p => new Set(p).add(q.id))} className="w-full border-2 border-secondary bg-transparent py-5 text-base font-semibold text-secondary hover:bg-secondary/10">
                  <FileText className="mr-2 h-4 w-4" /> Show Full Explanation
                </Button>
              )}
            </div>
          )
        })()}
      </div>
    )
  }

  // MCQ
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-border bg-background p-5 shadow-sm">
        <div className="prose prose-sm max-w-none text-foreground leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_th]:bg-[#05223A] [&_th]:text-white [&_th]:px-4 [&_th]:py-3 [&_th]:border [&_th]:border-border [&_td]:px-4 [&_td]:py-3 [&_td]:border [&_td]:border-border" dangerouslySetInnerHTML={{ __html: q.question_text || "" }} />
      </div>
      {q.figures.filter(f => f.figure_type !== 'explanation').length > 0 && (
        <div className="flex flex-wrap gap-3">
          {q.figures.filter(f => f.figure_type !== 'explanation').map(f => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f.id} src={f.image_url} alt="Question figure" className="max-h-64 rounded-lg border border-border object-contain" />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {(() => {
          const totalSelects = q.options.reduce((sum, o) => sum + Number(o.selection_count || 0), 0)
          return q.options.map((o, i) => {
            const count = Number(o.selection_count || 0)
            const percentage = totalSelects > 0 ? Math.round((count / totalSelects) * 100) : 0
            return (
              <OptionBtn key={o.id} opt={o} letter={LETTERS[i]} isSelected={selectedId === o.id} isRevealed={revealed || !!hideSubmit} percentage={percentage} onClick={() => onSelect(o.id)} />
            )
          })
        })()}
      </div>
      {!revealed && !hideSubmit && !isExamMode && (
        <Button onClick={onReveal} disabled={selectedId === null} className="w-full bg-primary py-5 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Submit Answer
        </Button>
      )}
      {(revealed || hideSubmit) && (() => {
        const correct = q.options.find(o => o.correct); return correct ? (
          <div className="rounded-lg border border-green-500 bg-green-500/10 px-4 py-3">
            <span className="text-sm font-bold text-foreground">Correct: </span>
            <span className="text-sm text-foreground">{LETTERS[q.options.indexOf(correct)]}) {correct.option}</span>
          </div>
        ) : null
      })()}
      {(revealed || hideSubmit || selectedId !== null) && onNext && (
        <Button onClick={onNext} className="w-full bg-secondary py-5 text-base font-semibold text-secondary-foreground hover:bg-secondary/90 shadow-lg border-2 border-secondary hover:translate-y-[-2px] transition-transform">
          Next Question <ChevronRight className="ml-2 h-5 w-5 inline" />
        </Button>
      )}
      {showExplanation && (revealed || hideSubmit) && (q.explanation_html || q.figures.some(f => f.figure_type === 'explanation')) && (
        <div className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-base font-bold text-foreground">Explanation:</h4>
          {q.explanation_html && (
            <div className="prose prose-sm max-w-none text-foreground mb-4 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-[#05223A] [&_th]:text-white [&_th]:px-4 [&_th]:py-3 [&_th]:border [&_th]:border-border [&_td]:px-4 [&_td]:py-3 [&_td]:border [&_td]:border-border [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-3" dangerouslySetInnerHTML={{ __html: q.explanation_html }} />
          )}
          {q.figures.filter(f => f.figure_type === 'explanation').length > 0 && (
            <div className="flex flex-wrap gap-3">
              {q.figures.filter(f => f.figure_type === 'explanation').map(f => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f.id} src={f.image_url} alt="Explanation figure" className="max-h-64 rounded-lg border border-border object-contain" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SessionDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const courseId = parseInt(slug) || 0
  const { user, isAdmin } = useAuth()

  // Subscription check
  const { data: subCheck, isLoading: subLoading } = useSWR(
    user && !isAdmin ? `/api/subscriptions/check?user_id=${user.id}&course_id=${courseId}` : null
  )
  const { data: courseData } = useSWR(`/api/courses/${slug}`)
  const { data: subjects } = useSWR<DBSubject[]>(`/api/courses/${slug}/subjects`)
  const { data: history } = useSWR<Assessment[]>(
    user ? `/api/sessions?user_id=${user.id}&course_id=${courseId}` : null
  )

  // ─── Modes ──────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("dashboard")
  const [dashTab, setDashTab] = useState<"new" | "history">("new")

  // ─── Dashboard config ───────────────────────────────────────────
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set())
  const [questionCount, setQuestionCount] = useState(20)
  const [timedMode, setTimedMode] = useState(false)
  const [timeLimit, setTimeLimit] = useState(30)
  const [progressFilter, setProgressFilter] = useState<"all" | "new" | "correct" | "incorrect">("all")
  const [examFilter, setExamFilter] = useState<"All" | "Mid" | "Final">("All")

  const toggleSubject = useCallback((id: number) => {
    setSelectedSubjects(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }, [])

  const maxAvailableQuestions = useMemo(() => {
    if (!subjects) return 100

    const getCount = (s: DBSubject) => {
      if (examFilter === "Mid") return Number(s.mid_question_count || 0)
      if (examFilter === "Final") return Number(s.final_question_count || 0)
      return Number(s.question_count || 0)
    }

    if (selectedSubjects.size === 0) {
      return subjects.reduce((sum, s) => sum + getCount(s), 0)
    }
    return subjects.filter(s => selectedSubjects.has(s.id)).reduce((sum, s) => sum + getCount(s), 0)
  }, [subjects, selectedSubjects, examFilter])

  useEffect(() => {
    if (subjects) {
      setQuestionCount(prev => {
        if (maxAvailableQuestions === 0) return 0
        if (prev > maxAvailableQuestions) return maxAvailableQuestions
        if (prev === 0 && maxAvailableQuestions > 0) return Math.min(20, maxAvailableQuestions)
        return prev
      })
    }
  }, [maxAvailableQuestions, subjects])

  // ─── Session state ─────────────────────────────────────────────
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [questions, setQuestions] = useState<DBQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({}) // questionId -> optionId
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [questionsLoading, setQuestionsLoading] = useState(true) // Start true to check for active

  // ─── Exam timer ────────────────────────────────────────────────
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (mode === "exam" && endTimeRef.current) {
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((endTimeRef.current! - Date.now()) / 1000))
        setSecondsLeft(remaining)
        if (remaining <= 0 && timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }, 500)
      return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
    }
  }, [mode])

  // Auto-submit on time's up
  useEffect(() => {
    if (mode === "exam" && secondsLeft === 0 && questions.length > 0 && endTimeRef.current) {
      endTimeRef.current = null // Prevent double-trigger
      handleExamSubmit()
    }
  }, [secondsLeft, mode, questions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Check for active session immediately
  useEffect(() => {
    if (!user || !courseId) return
    let mounted = true

    fetch(`/api/sessions/active?user_id=${user.id}&course_id=${courseId}`)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return
        if (data && data.questions) {
          // Store active session data but don't force UI into it yet
          setActiveSessionId(data.assessment_id)
        }
      })
      .catch(console.error)
      .finally(() => { if (mounted) setQuestionsLoading(false) })

    return () => { mounted = false }
  }, [user, courseId])

  // Sync current index
  useEffect(() => {
    if (mode === "session" && activeSessionId) {
      fetch(`/api/sessions/${activeSessionId}/sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_position: currentIdx })
      }).catch(console.error)
    }
  }, [currentIdx, activeSessionId, mode])

  // Scroll to top on mobile when question changes
  useEffect(() => {
    if ((mode === "study" || mode === "exam" || mode === "session") && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [currentIdx, mode])

  // ─── Computed ──────────────────────────────────────────────────
  const currentQ = questions[currentIdx]
  const [examResults, setExamResults] = useState<{ total: number; correct: number; score: number } | null>(null)

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`

  // ─── Handlers ──────────────────────────────────────────────────
  async function startSession(sessionMode: "study" | "exam" | "session") {
    setQuestionsLoading(true)
    try {
      if (sessionMode === "session") {
        const payload: any = {
          user_id: user?.id,
          course_id: courseId,
          limit: questionCount,
          subject_ids: Array.from(selectedSubjects),
          mode: sessionMode
        }
        if (examFilter !== "All") payload.exam_period = examFilter

        const res = await fetch(`/api/sessions/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        const data = await res.json()

        if (!data.questions || !data.questions.length) {
          alert("No questions found for this selection.");
          setQuestionsLoading(false);
          return
        }

        setActiveSessionId(data.assessment_id)
        setQuestions(data.questions)
      } else {
        // Study or Exam ( Stateless )
        const params = new URLSearchParams({ course_id: String(courseId), limit: String(questionCount) })
        if (selectedSubjects.size > 0) params.set("subject_ids", Array.from(selectedSubjects).join(","))
        if (sessionMode === "exam") params.set("type_id", "1") // 1 = MCQ, 2 = CBQ
        if (examFilter !== "All") params.set("exam_period", examFilter)

        const res = await fetch(`/api/questions?${params}`)
        const data = await res.json()

        if (!data.length) { alert("No questions found for this selection."); setQuestionsLoading(false); return }

        setQuestions(data)
        setActiveSessionId(null) // Unbind from any dangling ID

        if (sessionMode === "exam" && timedMode) {
          endTimeRef.current = Date.now() + timeLimit * 60 * 1000
          setSecondsLeft(timeLimit * 60)
        } else {
          endTimeRef.current = null
        }
      }

      setCurrentIdx(0)
      setAnswers({})
      setRevealed(new Set())
      setFlagged(new Set())
      setExamResults(null)
      setMode(sessionMode)
    } catch { alert("Failed to start.") }
    setQuestionsLoading(false)
  }

  async function resumeSession(sessionId: number) {
    setQuestionsLoading(true)
    try {
      const res = await fetch(`/api/sessions/active?user_id=${user?.id}&course_id=${courseId}`)
      const data = await res.json()

      if (data && data.questions && data.assessment_id === sessionId) {
        setActiveSessionId(data.assessment_id)
        setQuestions(data.questions)
        setCurrentIdx(data.current_position || 0)

        const restoredAnswers: Record<number, number> = {}
        const restoredRevealed = new Set<number>()
        const restoredFlagged = new Set<number>()

        data.questions.forEach((q: any) => {
          if (q._savedAnswerId) {
            restoredAnswers[q.id] = q._savedAnswerId
            restoredRevealed.add(q.id)
          }
          if (q._savedFlagged) restoredFlagged.add(q.id)
        })

        setAnswers(restoredAnswers)
        setRevealed(restoredRevealed)
        setFlagged(restoredFlagged)
        setMode("session")
        setDashTab("new") // switch back to main view
      }
    } catch (e) {
      console.error(e)
      alert("Failed to resume session.")
    }
    setQuestionsLoading(false)
  }

  function handleSelect(optionId: number) {
    if (!currentQ) return
    if ((mode === "study" || mode === "session") && revealed.has(currentQ.id)) return

    setAnswers(prev => ({ ...prev, [currentQ.id]: optionId }))

    if (mode === "study") {
      setRevealed(prev => new Set(prev).add(currentQ.id))
    }

    // Sync to backend immediately ONLY if in session mode
    if (mode === "session" && activeSessionId) {
      fetch(`/api/sessions/${activeSessionId}/sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: currentQ.id, answer_id: optionId })
      }).catch(console.error)
    }
  }

  function handleReveal() {
    if (!currentQ) return
    setRevealed(prev => new Set(prev).add(currentQ.id))
  }

  function handleFlagToggle(questionId: number) {
    setFlagged(p => {
      const n = new Set(p);
      const isNowFlagged = !n.has(questionId)
      if (isNowFlagged) n.add(questionId); else n.delete(questionId);

      // Sync flag state immediately
      if (mode === "session" && activeSessionId) {
        fetch(`/api/sessions/${activeSessionId}/sync`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question_id: questionId, flagged: isNowFlagged })
        }).catch(console.error)
      }
      return n
    })
  }

  function abandonSession() {
    if (activeSessionId) {
      fetch(`/api/sessions/${activeSessionId}/sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abandon" })
      }).catch(console.error)
    }
    setActiveSessionId(null)
    setMode("dashboard")
    setQuestions([])
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleExamSubmit() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    endTimeRef.current = null

    // Calculate results locally
    let correct = 0
    questions.forEach(q => {
      const selId = answers[q.id]
      if (selId) {
        const opt = q.options.find(o => o.id === selId)
        if (opt?.correct) correct++
      }
    })
    setExamResults({ total: questions.length, correct, score: Math.round((correct / questions.length) * 100) })

    // If stateless exam, save it to history explicitly
    if (mode === "exam" && user) {
      const payload = questions.map((q, i) => ({
        position: i + 1, question_id: q.id, answer_id: answers[q.id] || null, flagged: flagged.has(q.id), note: null
      }))

      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id, course_id: courseId, type_id: 2, subject_ids: Array.from(selectedSubjects)
        })
      })
        .then(r => r.json())
        .then(data => {
          if (data.id) {
            fetch("/api/sessions", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assessment_id: data.id, answers: payload })
            }).catch(console.error)
          }
        })
        .catch(console.error)
    }

    // If stateful session, mark as completed on server
    if (mode === "session" && activeSessionId) {
      fetch(`/api/sessions/${activeSessionId}/sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" })
      }).catch(console.error)
      setActiveSessionId(null) // Clear active pointer so we don't automatically resume the completed exam
    }

    setMode("results")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // ─── Guard: not logged in ──────────────────────────────────────
  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Login Required</h2>
        <p className="text-sm text-muted-foreground">Please log in to access course sessions.</p>
        <Link href="/login"><Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Log In</Button></Link>
      </div>
    )
  }

  // ─── Guard: subscription check ─────────────────────────────────
  if (!isAdmin) {
    if (subLoading) {
      return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div>
    }
    if (!subCheck?.subscribed) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
          <Lock className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">Subscription Required</h2>
          <p className="text-center text-sm text-muted-foreground">You need an active subscription to access this course.</p>
          <Link href={`/course/${slug}/payment`}><Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Subscribe Now</Button></Link>
        </div>
      )
    }
  }

  const courseName = courseData?.name || `Course ${slug}`

  // ════════════════════════════════════════════════════════════════
  // RESULTS MODE
  // ════════════════════════════════════════════════════════════════
  if (mode === "results" && examResults) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4 border-secondary bg-secondary/10">
          <span className="text-4xl font-bold text-secondary">{examResults.score}%</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Exam Complete</h2>
        <p className="mt-2 text-muted-foreground">{examResults.correct} / {examResults.total} correct answers</p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => { setMode("dashboard"); setQuestions([]) }} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Back to Dashboard
          </Button>
          <Button onClick={() => { setMode("study"); setRevealed(new Set(questions.map(q => q.id))) }} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Review Answers
          </Button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // STUDY / EXAM MODE
  // ════════════════════════════════════════════════════════════════
  if ((mode === "study" || mode === "exam" || mode === "session") && currentQ) {
    return (
      <div className="relative min-h-screen">


        {/* Top bar */}
        <div className="sticky top-0 z-20 border-b border-border bg-primary px-4 py-2.5">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => handleFlagToggle(currentQ.id)}
                className={`transition-colors ${flagged.has(currentQ.id) ? "text-secondary" : "text-primary-foreground/60 hover:text-secondary"}`} aria-label="Flag question">
                <Flag className="h-5 w-5" fill={flagged.has(currentQ.id) ? "currentColor" : "none"} />
              </button>
              <span className="text-sm font-semibold text-primary-foreground">
                {mode === "study" ? "Study" : mode === "exam" ? "Exam" : "Session"} - Q {currentIdx + 1}/{questions.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {mode === "exam" && (
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${secondsLeft < 60 ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary-foreground/20 text-primary-foreground"}`}>
                  <Clock className="mr-1 inline h-3.5 w-3.5" />{formatTime(secondsLeft)}
                </span>
              )}
              <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-foreground/30 text-primary-foreground disabled:opacity-30" aria-label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))} disabled={currentIdx === questions.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground text-primary disabled:opacity-30" aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 relative overflow-hidden rounded-xl pb-4">
              {/* Watermark Overlay scoped to question container */}
              <div className="pointer-events-none absolute inset-0 z-0 flex select-none flex-col items-center justify-center overflow-hidden opacity-[0.04] mix-blend-multiply dark:opacity-[0.02] dark:mix-blend-screen">
                <div className="flex -rotate-45 flex-col items-center justify-center gap-8 md:gap-16">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex gap-8 whitespace-nowrap md:gap-16">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className="text-3xl font-black uppercase tracking-widest text-foreground md:text-6xl">MUTAHQBANK</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10">
                <QuestionView q={currentQ} selectedId={answers[currentQ.id] ?? null}
                  revealed={(mode === "study" || mode === "session") ? revealed.has(currentQ.id) : false}
                  onSelect={handleSelect} onReveal={handleReveal}
                  showExplanation={mode === "study" || mode === "session"}
                  hideSubmit={mode === "study"}
                  isExamMode={mode === "exam"}
                  onNext={currentIdx < questions.length - 1 ? () => setCurrentIdx(currentIdx + 1) : undefined}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-5">
              {/* Grid Navigator */}
              <div className="overflow-hidden rounded-xl border border-border shadow-sm flex flex-col">
                <div className="bg-primary px-4 py-2 shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">Questions</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 p-3 max-h-[60vh] overflow-y-auto">
                  {questions.map((q, idx) => {
                    const answered = answers[q.id] !== undefined
                    const isCurrent = idx === currentIdx
                    const isFlag = flagged.has(q.id)
                    let bg = "bg-muted text-muted-foreground hover:bg-muted/80"
                    if (isCurrent) bg = "bg-primary text-primary-foreground"
                    else if (answered) bg = "bg-green-500/20 text-green-700"
                    return (
                      <button key={q.id} onClick={() => setCurrentIdx(idx)}
                        className={`relative flex h-9 items-center justify-center rounded text-xs font-semibold transition-colors ${bg}`}>
                        {idx + 1}
                        {isFlag && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-secondary" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              {(mode === "exam" || mode === "session") && (
                <Button onClick={handleExamSubmit} className="w-full bg-destructive py-5 text-base font-semibold text-destructive-foreground hover:bg-destructive/90">
                  Submit Session
                </Button>
              )}

              {mode === "session" ? (
                <Button variant="outline" onClick={abandonSession}
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  Abandon Session
                </Button>
              ) : (
                <Button variant="outline" onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setMode("dashboard"); setQuestions([]); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  End Session
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // DASHBOARD MODE
  // ════════════════════════════════════════════════════════════════
  return (
    <div>
      <nav className="bg-muted/50 px-4 py-3" aria-label="Breadcrumb">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><Home className="h-3.5 w-3.5" /> Home</Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <Link href={`/course/${slug}`} className="text-muted-foreground hover:text-foreground">{courseName}</Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">Session Dashboard</span>
        </div>
      </nav>

      <section className="bg-primary px-4 py-10">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-2xl font-bold text-white md:text-3xl">{courseName} - Session Dashboard</h1>
          <p className="mt-2 text-sm text-white/70">Create a study or exam session</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 pt-8">
        <div className="flex gap-4 border-b border-border">
          <button onClick={() => setDashTab("new")} className={`pb-3 text-sm font-semibold transition-colors ${dashTab === "new" ? "border-b-2 border-secondary text-secondary" : "text-muted-foreground hover:text-foreground"}`}>New Session</button>
          <button onClick={() => setDashTab("history")} className={`pb-3 text-sm font-semibold transition-colors ${dashTab === "history" ? "border-b-2 border-secondary text-secondary" : "text-muted-foreground hover:text-foreground"}`}>Session History</button>
        </div>
      </div>

      {dashTab === "new" ? (
        <section className="mx-auto max-w-4xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                <div className="bg-primary px-4 py-3"><h2 className="font-bold text-primary-foreground">Configure Your Session</h2></div>
                <div className="flex flex-col gap-6 p-6">
                  {/* Progress filter */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">Filter by Progress</label>
                    <div className="flex flex-wrap gap-2">
                      {(["all", "new", "correct", "incorrect"] as const).map(f => (
                        <button key={f} onClick={() => setProgressFilter(f)}
                          className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${progressFilter === f ? "bg-secondary text-secondary-foreground" : "border border-border bg-background text-foreground hover:bg-muted"}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exam Type Filter */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">Filter by Exam Type</label>
                    <div className="flex flex-wrap gap-2">
                      {(["All", "Mid", "Final"] as const).map(f => (
                        <button key={f} onClick={() => setExamFilter(f)}
                          className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${examFilter === f ? "bg-secondary text-secondary-foreground" : "border border-border bg-background text-foreground hover:bg-muted"}`}>
                          {f} Exams
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question count */}
                  <div>
                    <label className="mb-2 flex items-center justify-between text-sm font-semibold text-foreground">
                      <span className="flex items-center gap-2"><Hash className="h-4 w-4" /> Number of Questions</span>
                      {subjects && <span className="text-xs font-normal text-muted-foreground mr-1">Max Available: {maxAvailableQuestions}</span>}
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={maxAvailableQuestions === 0 ? 0 : Math.min(1, maxAvailableQuestions)}
                        max={maxAvailableQuestions}
                        step="1"
                        value={questionCount}
                        onChange={e => setQuestionCount(Number(e.target.value))}
                        className="flex-1 accent-secondary"
                        disabled={maxAvailableQuestions === 0}
                      />
                      <input
                        type="number"
                        min={maxAvailableQuestions === 0 ? 0 : Math.min(1, maxAvailableQuestions)}
                        max={maxAvailableQuestions}
                        value={questionCount}
                        onChange={e => setQuestionCount(Number(e.target.value))}
                        onBlur={() => {
                          let val = questionCount
                          const minVal = maxAvailableQuestions === 0 ? 0 : Math.min(1, maxAvailableQuestions)
                          if (val < minVal) val = minVal
                          if (val > maxAvailableQuestions) val = maxAvailableQuestions
                          setQuestionCount(val)
                        }}
                        className="w-16 rounded-md border border-input bg-background px-2 py-1 text-center text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={maxAvailableQuestions === 0}
                      />
                    </div>
                  </div>

                  {/* Timed mode */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Clock className="h-4 w-4" /> Timed Mode (Exam Only)</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setTimedMode(!timedMode)} className={`relative h-6 w-11 rounded-full transition-colors ${timedMode ? "bg-secondary" : "bg-muted-foreground/30"}`} role="switch" aria-checked={timedMode}>
                        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${timedMode ? "translate-x-5" : ""}`} />
                      </button>
                      {timedMode && (
                        <div className="flex items-center gap-2">
                          <input type="number" min="5" max="180" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))}
                            className="w-16 rounded-md border border-input bg-background px-2 py-1 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                          <span className="text-xs text-muted-foreground">minutes</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subjects */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">Select Subjects ({selectedSubjects.size} selected)</label>
                    {subjects ? (
                      <div className="max-h-[340px] overflow-y-auto rounded-lg border border-border">
                        {subjects.map(s => {
                          const count = examFilter === "Mid" ? Number(s.mid_question_count || 0) : examFilter === "Final" ? Number(s.final_question_count || 0) : Number(s.question_count || 0)
                          return (
                            <button key={s.id} onClick={() => toggleSubject(s.id)}
                              className="flex w-full items-center gap-2 border-b border-border/50 px-3 py-2 text-left transition-colors hover:bg-muted/50">
                              {selectedSubjects.has(s.id) ? <CheckSquare className="h-4 w-4 shrink-0 text-secondary" /> : <Square className="h-4 w-4 shrink-0 text-muted-foreground" />}
                              <span className="flex-1 text-sm text-foreground">{s.name}</span>
                              <span className="text-xs text-muted-foreground">{count} Q</span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 overflow-hidden rounded-xl border border-border shadow-sm">
                <div className="bg-secondary px-4 py-3"><h3 className="font-bold text-secondary-foreground">Session Summary</h3></div>
                <div className="flex flex-col gap-4 p-6">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Course</span><span className="font-medium text-foreground">{courseName}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Questions</span><span className="font-medium text-foreground">{questionCount}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Exam Type</span><span className="font-medium capitalize text-foreground">{examFilter}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progress</span><span className="font-medium capitalize text-foreground">{progressFilter}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Exam Timer</span><span className="font-medium text-foreground">{timedMode ? `${timeLimit} min` : "Off"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subjects</span><span className="font-medium text-foreground">{selectedSubjects.size || "All"}</span></div>
                  <hr className="border-border" />
                  <Button onClick={() => startSession("study")} disabled={questionsLoading || maxAvailableQuestions === 0}
                    className="w-full border-2 border-secondary bg-transparent py-5 text-base font-semibold text-secondary hover:bg-secondary/10 disabled:opacity-50">
                    {questionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />} Study Mode
                  </Button>
                  <Button onClick={() => startSession("exam")} disabled={questionsLoading || maxAvailableQuestions === 0}
                    className="w-full border-2 border-primary bg-transparent py-5 text-base font-semibold text-primary hover:bg-primary/10 disabled:opacity-50">
                    {questionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Timer className="mr-2 h-4 w-4" />} Exam Mode
                  </Button>
                  <hr className="border-border" />
                  <Button onClick={() => startSession("session")} disabled={questionsLoading || maxAvailableQuestions === 0}
                    className="w-full bg-secondary py-5 text-base font-bold text-secondary-foreground shadow hover:bg-secondary/90 disabled:opacity-50">
                    {questionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin outline-none" /> : <BookOpen className="mr-2 h-4 w-4" />} Session Mode
                  </Button>
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => { setSelectedSubjects(new Set()); setQuestionCount(20); setTimedMode(false); setProgressFilter("all"); setExamFilter("All"); }}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-4xl px-4 py-8">
          <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <div className="bg-primary px-4 py-3"><h2 className="font-bold text-primary-foreground">Session History</h2></div>
            {history && history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">Questions</th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">Score</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Action</th>
                  </tr></thead>
                  <tbody>
                    {history.map((h, index) => {
                      const total = Number(h.total_questions) || 0
                      const correct = Number(h.correct_answers) || 0
                      const pct = total > 0 ? Math.round((correct / total) * 100) : 0

                      // Check if it's the resumable active session
                      const isActive = (activeSessionId === h.id) || (h as any).status === 'active'

                      return (
                        <tr key={`${h.id}-${index}`} className="border-b border-border/50">
                          <td className="px-4 py-3 capitalize text-foreground">
                            {isActive ? <span className="font-bold text-secondary">Session Mode (Active)</span> : h.assessment_type === "1" ? "Session" : h.assessment_type}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(h.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-center text-foreground">{total}</td>
                          <td className="px-4 py-3 text-center">
                            {isActive ? (
                              <span className="text-muted-foreground italic">In Progress</span>
                            ) : (
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${pct >= 70 ? "bg-green-500/20 text-green-700" : pct >= 50 ? "bg-amber-500/20 text-amber-700" : "bg-destructive/20 text-destructive"}`}>
                                {correct}/{total} ({pct}%)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isActive ? (
                              <Button size="sm" onClick={() => resumeSession(h.id)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Resume</Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Completed</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No sessions yet. Start your first session!</p>
                <Button className="mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => setDashTab("new")}>Create New Session</Button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
