"use client"

import { use, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Home, ChevronRight, CheckCircle2, XCircle, Eye, ArrowRight, Trophy, Lock, Sparkles } from "lucide-react"

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

  /* ─── Study session screen ─── */
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

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Question {currentQ + 1} of 5</span>
            <span>{score} correct so far</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-secondary transition-all duration-500" style={{ width: `${((currentQ + (revealed ? 1 : 0)) / 5) * 100}%` }} />
          </div>
          {/* Step dots */}
          <div className="mt-3 flex justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-2.5 w-2.5 rounded-full transition-all ${i < currentQ ? (answers[i] === SAMPLE_QUESTIONS[i].correctIndex ? "bg-green-500" : "bg-destructive") :
                  i === currentQ ? "bg-secondary ring-2 ring-secondary/30 ring-offset-1 ring-offset-background" :
                    "bg-muted-foreground/20"
                }`} />
            ))}
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-xl border border-border bg-background p-6 shadow-sm md:p-8">
          <p className="text-lg font-semibold leading-relaxed text-foreground">{q.question}</p>

          <div className="mt-6 flex flex-col gap-3">
            {q.options.map((opt, idx) => {
              let optionClasses = "flex items-center gap-3 rounded-lg border-2 px-4 py-3.5 text-sm font-medium transition-all cursor-pointer"

              if (revealed) {
                if (idx === q.correctIndex) {
                  optionClasses += " border-green-500 bg-green-50 text-green-800 dark:bg-green-500/10 dark:text-green-400"
                } else if (idx === selectedOption && idx !== q.correctIndex) {
                  optionClasses += " border-destructive bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-400"
                } else {
                  optionClasses += " border-border bg-muted/30 text-muted-foreground"
                }
              } else if (idx === selectedOption) {
                optionClasses += " border-secondary bg-secondary/5 text-foreground"
              } else {
                optionClasses += " border-border bg-background text-foreground hover:border-secondary/50 hover:bg-muted/40"
              }

              return (
                <button key={idx} onClick={() => handleSelect(idx)} disabled={revealed} className={optionClasses}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-left">{opt}</span>
                  {revealed && idx === q.correctIndex && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-green-500" />}
                  {revealed && idx === selectedOption && idx !== q.correctIndex && <XCircle className="ml-auto h-5 w-5 shrink-0 text-destructive" />}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {revealed && (
            <div className="mt-6 rounded-lg border border-secondary/30 bg-secondary/5 p-5">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-secondary">
                <Eye className="h-4 w-4" /> Explanation
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex justify-end gap-3">
            {!revealed ? (
              <Button onClick={handleReveal} disabled={selectedOption === null} className="bg-secondary px-6 text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50">
                <Eye className="mr-2 h-4 w-4" /> Show Answer
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-primary px-6 text-primary-foreground hover:bg-primary/90">
                {currentQ < 4 ? "Next Question" : "See Results"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Free preview note */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          This is a free preview with sample questions. Subscribe to access the full question bank.
        </p>
      </div>
    </div>
  )
}
