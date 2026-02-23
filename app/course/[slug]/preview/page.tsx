"use client"

import { use, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Home, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Eye, ArrowRight, Trophy, Lock, Sparkles, Flag } from "lucide-react"

// Global SWRProvider handles fetching and caching rules

/* ─── 5 hard-coded sample questions (zero network calls) ─── */
const SAMPLE_QUESTIONS = [
  {
    question: "Which of the following is the most common cause of iron deficiency anemia in adult males and postmenopausal women?",
    options: ["Inadequate dietary intake", "Chronic gastrointestinal blood loss", "Menorrhagia", "Hemolysis"],
    correctIndex: 1,
    explanation: "In adult males and postmenopausal women, the most common cause of iron deficiency anemia is chronic gastrointestinal blood loss, often from sources like peptic ulcers, colorectal cancer, or chronic NSAID use. Dietary deficiency is more common in developing countries, and menorrhagia applies to premenopausal women.",
  },
  {
    question: "A 45-year-old patient presents with sudden onset of severe headache described as 'the worst headache of my life.' What is the most likely diagnosis?",
    options: ["Migraine", "Tension headache", "Subarachnoid hemorrhage", "Cluster headache"],
    correctIndex: 2,
    explanation: "A sudden onset, severe headache described as the 'worst headache of my life' is the classic presentation of a subarachnoid hemorrhage (SAH), often caused by a ruptured berry aneurysm. This is a medical emergency requiring immediate CT scan and, if negative, lumbar puncture.",
  },
  {
    question: "Which cardiac enzyme is the most specific marker for myocardial infarction?",
    options: ["Creatine Kinase MB (CK-MB)", "Troponin I", "Lactate Dehydrogenase (LDH)", "Myoglobin"],
    correctIndex: 1,
    explanation: "Troponin I (and Troponin T) are the most specific and sensitive biomarkers for myocardial infarction. They are released into the bloodstream when myocardial cells are damaged and remain elevated for several days, making them ideal for both early and late diagnosis.",
  },
  {
    question: "What is the first-line treatment for community-acquired pneumonia in an otherwise healthy adult outpatient?",
    options: ["Intravenous ceftriaxone", "Oral amoxicillin", "Oral azithromycin or doxycycline", "Oral levofloxacin"],
    correctIndex: 2,
    explanation: "For otherwise healthy adult outpatients with community-acquired pneumonia and no comorbidities or risk factors for drug-resistant organisms, a macrolide (azithromycin) or doxycycline is the recommended first-line treatment according to current guidelines.",
  },
  {
    question: "A patient with type 2 diabetes is started on metformin. What is the most serious potential side effect that should be monitored?",
    options: ["Hypoglycemia", "Weight gain", "Lactic acidosis", "Hepatotoxicity"],
    correctIndex: 2,
    explanation: "Lactic acidosis is the most serious, though rare, side effect of metformin. It is more likely to occur in patients with renal impairment, hepatic disease, or conditions that cause tissue hypoxia. Metformin should be avoided or used cautiously in such patients. Notably, metformin alone rarely causes hypoglycemia.",
  },
]

type Mode = "cta" | "session" | "complete"

export default function FreePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data: course } = useSWR<{ id: number; name: string; total_questions: string | number }>(
    `/api/courses/${slug}`
  )

  const [mode, setMode] = useState<Mode>("cta")
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(5).fill(null))

  const courseName = course?.name || "this course"
  const totalQuestions = Number(course?.total_questions) || 0
  const q = SAMPLE_QUESTIONS[currentQ]

  const handleSelect = (idx: number) => {
    if (revealed) return
    setSelectedOption(idx)
  }

  const handleReveal = () => {
    if (selectedOption === null) return
    setRevealed(true)
    const newAnswers = [...answers]
    newAnswers[currentQ] = selectedOption
    setAnswers(newAnswers)
    if (selectedOption === q.correctIndex) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (currentQ < 4) {
      setCurrentQ(currentQ + 1)
      setSelectedOption(null)
      setRevealed(false)
    } else {
      setMode("complete")
    }
  }

  /* ─── CTA screen ─── */
  if (mode === "cta") {
    return (
      <div className="min-h-screen bg-background">
        <nav className="bg-muted/50 px-4 py-3" aria-label="Breadcrumb">
          <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm">
            <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><Home className="h-3.5 w-3.5" /> Home</Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Link href={`/course/${slug}`} className="text-muted-foreground hover:text-foreground">{courseName}</Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">Free Preview</span>
          </div>
        </nav>

        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="relative w-full max-w-lg">
            {/* Glow ring behind card */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-secondary/40 via-primary/30 to-secondary/40 opacity-60 blur-xl" />

            <div className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
              {/* Top accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-secondary via-primary to-secondary" />

              <div className="flex flex-col items-center px-8 py-12 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                  <Sparkles className="h-8 w-8 text-secondary" />
                </div>
                <h1 className="text-balance text-2xl font-bold text-foreground md:text-3xl">
                  Try for Free
                </h1>
                <p className="mt-3 max-w-sm text-pretty text-muted-foreground">
                  Start a session with 5 sample questions from <span className="font-medium text-foreground">{courseName}</span>. No account needed.
                </p>

                <ul className="mt-6 flex flex-col gap-2 text-left text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" /> 5 curated medical questions</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" /> Instant answer explanations</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" /> See your score at the end</li>
                </ul>

                <Button
                  onClick={() => setMode("session")}
                  className="group mt-8 bg-secondary px-8 py-6 text-base font-semibold text-secondary-foreground shadow-lg transition-all hover:bg-secondary/90 hover:shadow-xl hover:-translate-y-0.5"
                >
                  Start Free Preview
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─── Completion / Upsell screen ─── */
  if (mode === "complete") {
    const percentage = Math.round((score / 5) * 100)
    return (
      <div className="min-h-screen bg-background">
        <nav className="bg-muted/50 px-4 py-3" aria-label="Breadcrumb">
          <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm">
            <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><Home className="h-3.5 w-3.5" /> Home</Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Link href={`/course/${slug}`} className="text-muted-foreground hover:text-foreground">{courseName}</Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">Results</span>
          </div>
        </nav>

        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-secondary/30 via-primary/20 to-secondary/30 opacity-50 blur-xl" />

            <div className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
              <div className="h-1.5 bg-gradient-to-r from-secondary via-primary to-secondary" />

              <div className="flex flex-col items-center px-8 py-12 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
                  <Trophy className="h-10 w-10 text-secondary" />
                </div>

                <h1 className="text-2xl font-bold text-foreground">Preview Complete!</h1>

                <div className="mt-6 flex items-center justify-center gap-4">
                  <div className="relative h-28 w-28">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" strokeDasharray={`${(percentage / 100) * 264} 264`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">{score}/5</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-semibold text-foreground">
                      {score >= 4 ? "Excellent!" : score >= 3 ? "Good job!" : score >= 2 ? "Not bad!" : "Keep practicing!"}
                    </p>
                    <p className="text-sm text-muted-foreground">{percentage}% correct</p>
                  </div>
                </div>

                {/* Review mini-summary */}
                <div className="mt-6 w-full space-y-1.5">
                  {SAMPLE_QUESTIONS.map((sq, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
                      {answers[i] === sq.correctIndex
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        : <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                      }
                      <span className="truncate text-foreground">Q{i + 1}: {sq.question.slice(0, 60)}...</span>
                    </div>
                  ))}
                </div>

                {/* Lock / Upsell */}
                <div className="mt-8 w-full rounded-xl border border-border bg-muted/30 p-6">
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <Lock className="h-5 w-5 text-secondary" />
                    <span className="text-sm font-semibold text-foreground">Unlock the Full Course</span>
                  </div>
                  <p className="text-pretty text-sm text-muted-foreground">
                    Subscribe to unlock{totalQuestions > 0 ? ` all ${totalQuestions.toLocaleString()}` : ""} questions, timed exams, and detailed performance tracking.
                  </p>
                  <Link href={`/course/${slug}/payment`}>
                    <Button className="mt-4 w-full bg-secondary py-5 text-base font-semibold text-secondary-foreground shadow-lg transition-all hover:bg-secondary/90 hover:shadow-xl hover:-translate-y-0.5">
                      Subscribe Now
                    </Button>
                  </Link>
                  <Link href={`/course/${slug}`} className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground underline">
                    Back to Course
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─── Study session screen (Mirroring Actual Session UI) ─── */
  return (
    <div className="relative min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-primary px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="transition-colors text-primary-foreground/60 hover:text-secondary disabled:opacity-50" aria-label="Flag question" disabled>
              <Flag className="h-5 w-5" fill="none" />
            </button>
            <span className="text-sm font-semibold text-primary-foreground">
              Free Preview - Q {currentQ + 1}/{SAMPLE_QUESTIONS.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-foreground/30 text-primary-foreground disabled:opacity-30" aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrentQ(Math.min(SAMPLE_QUESTIONS.length - 1, currentQ + 1))} disabled={currentQ === SAMPLE_QUESTIONS.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground text-primary disabled:opacity-30" aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 relative overflow-hidden rounded-xl pb-4">
            {/* Watermark Overlay */}
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

            <div className="relative z-10 flex flex-col gap-5">
              {/* Question Text */}
              <div className="rounded-lg border border-border bg-background p-5 shadow-sm">
                <div className="prose prose-sm max-w-none text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question }} />
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                {q.options.map((opt, idx) => {
                  let cls = "border-border bg-background"

                  if (revealed) {
                    if (idx === q.correctIndex) {
                      cls = "border-green-500 bg-green-500/10"
                    } else if (idx === selectedOption) {
                      cls = "border-destructive bg-destructive/10"
                    }
                  } else if (idx === selectedOption) {
                    cls = "border-secondary bg-secondary/5"
                  }

                  return (
                    <button key={idx} onClick={() => handleSelect(idx)} disabled={revealed}
                      className={`relative overflow-hidden flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${cls} ${revealed ? "cursor-default" : "hover:border-secondary/50"}`}>
                      <div className="relative z-10 flex w-full items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${idx === selectedOption ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 text-sm text-foreground">{opt}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Submit / Action Buttons */}
              {!revealed && (
                <Button onClick={handleReveal} disabled={selectedOption === null} className="w-full bg-primary py-5 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  Submit Answer
                </Button>
              )}

              {revealed && (
                <div className="rounded-lg border border-green-500 bg-green-500/10 px-4 py-3">
                  <span className="text-sm font-bold text-foreground">Correct: </span>
                  <span className="text-sm text-foreground">{String.fromCharCode(65 + q.correctIndex)}) {q.options[q.correctIndex]}</span>
                </div>
              )}

              {/* Explanation */}
              {revealed && (
                <div className="rounded-lg border border-border bg-background p-5 shadow-sm">
                  <h4 className="mb-3 text-base font-bold text-foreground">Explanation:</h4>
                  <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                </div>
              )}

              {/* Next button for preview flow */}
              {revealed && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleNext} className="bg-secondary px-6 text-secondary-foreground hover:bg-secondary/90">
                    {currentQ < 4 ? "Next Question" : "See Results"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
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
                {SAMPLE_QUESTIONS.map((_, idx) => {
                  const answered = answers[idx] !== null && answers[idx] !== undefined
                  const isCurrent = idx === currentQ

                  let bg = "bg-muted text-muted-foreground hover:bg-muted/80"
                  if (isCurrent) bg = "bg-primary text-primary-foreground"
                  else if (answered) bg = "bg-green-500/20 text-green-700"

                  return (
                    <button key={idx} onClick={() => setCurrentQ(idx)}
                      className={`relative flex h-9 items-center justify-center rounded text-xs font-semibold transition-colors ${bg}`}>
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <Link href={`/course/${slug}`}>
              <Button variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                End Preview
              </Button>
            </Link>
            {/* Free preview note */}
            <p className="mt-4 text-center text-xs text-muted-foreground px-2">
              This is a free preview with sample questions. Subscribe to access the full question bank.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
