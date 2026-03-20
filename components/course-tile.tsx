"use client"

import Link from "next/link"
import type { Course } from "@/lib/types"

export function CourseTile({ course }: { course: Course; index?: number }) {
  const imgSrc = course.hero_image || "/placeholder.svg"
  
  const isMiniOSCE = course.name.toLowerCase().includes("(miniosce)")
  const isFinal = course.name.toLowerCase().includes("(final)")
  
  let displayName = course.name
  if (isMiniOSCE) displayName = displayName.replace(/\(miniosce\)/i, "").trim()
  if (isFinal) displayName = displayName.replace(/\(final\)/i, "").trim()

  const isActive = Boolean(course.is_active)
  const showFinalOutline = isFinal && isActive

  return (
    <Link href={`/course/${course.id || course.slug}`} className="group block">
      <div className={`overflow-hidden rounded-xl shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl ${
        !isActive ? "ring-1 ring-border" : (showFinalOutline ? "ring-4 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "")
      }`}>
        <div className="relative aspect-[16/11] w-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={course.name}
            className={`h-full w-full object-cover transition-all duration-500 ${!course.is_active ? "grayscale-[0.8] opacity-80 group-hover:grayscale-0 group-hover:opacity-100" : ""}`}
            loading="lazy"
          />
          {/* Indicators Layer */}
          <div className="absolute inset-x-0 top-0 p-3 z-10 flex flex-col gap-2">
            {isFinal && (
               <div className="bg-red-600/90 backdrop-blur-md px-4 py-2 rounded-xl flex justify-center items-center shadow-2xl shadow-red-900/20 border border-red-400/20 animate-pulse transition-all">
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] ml-[0.4em]">FINAL</span>
               </div>
            )}
            
            <div className="flex justify-end pr-1">
              {isMiniOSCE && (
                 <span className="rounded-full bg-orange-500/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg ring-1 ring-white/20">
                   Mini-OSCE
                 </span>
              )}
            </div>
          </div>
          {!course.is_active && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-100 transition-opacity duration-300 group-hover:opacity-0">
               <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-secondary-foreground shadow-lg">
                 Coming Soon
               </span>
            </div>
          )}
          {!course.is_active && (
            <div className="absolute inset-0 hidden items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:flex group-hover:opacity-100">
               <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl">
                 Preview
               </span>
            </div>
          )}
        </div>
        <div className={`bg-primary px-3 py-2.5 text-center transition-colors ${!course.is_active ? "bg-slate-900" : ""}`}>
          <h3 className="text-sm font-semibold text-primary-foreground">{displayName}</h3>
          <div className="mt-1 flex items-center justify-center gap-3 text-xs text-primary-foreground/60">
            <span>{course.total_subjects} subjects</span>
            <span>{course.total_questions} Q</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
