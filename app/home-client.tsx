"use client"

import { CourseTile } from "@/components/course-tile"
import type { Course } from "@/lib/types"
import { BookOpen, FileText, Smartphone, RefreshCw, BookMarked, ClipboardList, HelpCircle } from "lucide-react"

const features = [
    { icon: BookOpen, title: "Organized past papers", description: "Questions organized by topic and exam type" },
    { icon: FileText, title: "Step by step explanation", description: "Detailed explanations for every question" },
    { icon: Smartphone, title: "Mobile friendly", description: "Study anywhere on any device" },
    { icon: RefreshCw, title: "Regular updates", description: "Continuously updated question banks" },
]

export function HomeClient({
    majors,
    minors4th,
    minors5th,
    stats,
}: {
    majors: Course[]
    minors4th: Course[]
    minors5th: Course[]
    stats: { total_courses: number; total_subjects: number; total_questions: number } | null
}) {
    return (
        <div>
            {/* Hero Section */}
            <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden md:min-h-[480px]">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url(/images/hero-bg.jpg)" }}
                />
                <div className="absolute inset-0 bg-primary/20" />
                <h1 className="relative z-10 mx-auto max-w-4xl px-4 text-center text-balance text-3xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
                    All Your Medical Education Needs Are Met Here
                </h1>
            </section>

            {/* Feature Cards */}
            <section className="bg-background py-12">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                        {features.map((feature) => (
                            <div key={feature.title} className="overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex flex-col items-center gap-3 bg-background p-6 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                                        <feature.icon className="h-6 w-6 text-secondary" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                                </div>
                                <div className="bg-primary px-4 py-2 text-center">
                                    <p className="text-xs text-primary-foreground/70">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Statistics Bar */}
            <section className="bg-muted py-10">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center gap-2 rounded-lg bg-background p-6 shadow-sm">
                            <BookMarked className="h-8 w-8 text-secondary" />
                            <span className="text-3xl font-bold text-foreground">{stats?.total_courses ?? 0}</span>
                            <span className="text-sm text-muted-foreground">Courses</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-lg bg-background p-6 shadow-sm">
                            <ClipboardList className="h-8 w-8 text-secondary" />
                            <span className="text-3xl font-bold text-foreground">{stats?.total_subjects ?? 0}</span>
                            <span className="text-sm text-muted-foreground">Subjects</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-lg bg-background p-6 shadow-sm">
                            <HelpCircle className="h-8 w-8 text-secondary" />
                            <span className="text-3xl font-bold text-foreground">{stats?.total_questions ?? 0}+</span>
                            <span className="text-sm text-muted-foreground">Questions</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Courses Sections */}
            <section className="bg-background py-12">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="mb-10 text-center">
                        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                            Explore All Courses and Learning Paths
                        </p>
                        <h2 className="mt-2 text-3xl font-bold text-foreground">Courses</h2>
                    </div>

                    {/* Majors */}
                    <div className="mb-10">
                        <h3 className="mb-4 border-b-2 border-secondary pb-2 text-xl font-bold text-foreground">
                            Majors
                        </h3>
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                            {majors.map((course, index) => (
                                <CourseTile key={course.id} course={course} index={index} />
                            ))}
                        </div>
                    </div>

                    {/* Minors - 4th Year */}
                    <div className="mb-10">
                        <h3 className="mb-4 border-b-2 border-secondary pb-2 text-xl font-bold text-foreground">
                            Minors - 4th Year
                        </h3>
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                            {minors4th.map((course, index) => (
                                <CourseTile key={course.id} course={course} index={index} />
                            ))}
                        </div>
                    </div>

                    {/* Minors - 5th Year */}
                    <div className="mb-4">
                        <h3 className="mb-4 border-b-2 border-secondary pb-2 text-xl font-bold text-foreground">
                            Minors - 5th Year
                        </h3>
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                            {minors5th.map((course, index) => (
                                <CourseTile key={course.id} course={course} index={index} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}
