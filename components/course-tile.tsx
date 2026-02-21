"use client"

import Link from "next/link"
import type { Course } from "@/lib/types"

export function CourseTile({ course }: { course: Course; index?: number }) {
  const imgSrc = course.hero_image || "/placeholder.svg"

  return (
    <Link href={`/course/${course.id || course.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div className="relative aspect-[16/11] w-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={course.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="bg-primary px-3 py-2.5 text-center">
          <h3 className="text-sm font-semibold text-primary-foreground">{course.name}</h3>
          <div className="mt-1 flex items-center justify-center gap-3 text-xs text-primary-foreground/60">
            <span>{course.total_subjects} subjects</span>
            <span>{course.total_questions} Q</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
