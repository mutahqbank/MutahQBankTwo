"use client"

import { Button } from "@/components/ui/button"
import { Check, BookOpen, Users, ArrowRight, Star } from "lucide-react"
import Link from "next/link"

export interface FeaturedPackage {
  id: number
  price: number
  original_price?: number | null
  users_limit: number
  duration: number
  custom_name: string | null
  design_level: string | null
  courses: Array<{ id: number; name: string; questions_count: number }>
  primary_slug?: string
  is_coming_soon?: boolean
}

function getPackageTitle(usersLimit: number, coursesCount: number) {
  if (usersLimit > 1) return `Package deal (${usersLimit} users)`
  if (coursesCount > 1) return "Package deal"
  return "Standard Package"
}

export function FeaturedPackageCard({ pkg, isCompact = false }: { pkg: FeaturedPackage, isCompact?: boolean }) {
  const isComingSoon = pkg.is_coming_soon
  const totalQuestions = pkg.courses?.reduce((sum, c) => sum + Number(c.questions_count), 0) ?? 0
  const title = pkg.custom_name?.trim() ? pkg.custom_name : getPackageTitle(pkg.users_limit, pkg.courses?.length ?? 0)
  const designLevel = pkg.design_level || "normal"
  
  // Original features
  // Shortened features for better fit
  const features = [
    `View all ${totalQuestions.toLocaleString()} questions.`,
    "Clear clinical explanations.",
    "Timed tests & tutor-led exams.",
  ]

  // Direct checkout link
  const checkoutUrl = `/course/${pkg.primary_slug || 'all'}/payment?pkg=${pkg.id}`

  // Price calculation
  const hasDiscount = pkg.original_price && pkg.original_price > pkg.price
  const discountPercentage = hasDiscount ? Math.round(((pkg.original_price! - pkg.price) / pkg.original_price!) * 100) : 0

  if (isComingSoon && pkg.id < 0) {
    return (
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-dashed border-border/40 bg-muted/10 p-1 transition-all">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center opacity-30">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background border border-dashed border-muted-foreground/20">
                <Star className="h-6 w-6 text-muted-foreground/20" />
            </div>
            <div className="mt-4 rounded-full bg-muted/50 px-8 py-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                Coming Soon
            </div>
        </div>
      </div>
    )
  }

  // Design classes from original UserPackageCard
  let containerClass = isComingSoon ? "border-muted/50 bg-background/50 opacity-80" : "border-border shadow-sm bg-background"
  let headerClass = isComingSoon ? "bg-muted/10 grayscale-[0.3]" : "bg-background"
  let contentClass = "bg-muted/30"
  let iconContainer = pkg.users_limit > 1 ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
  let textClass = "text-foreground"
  let textSecondaryClass = "text-muted-foreground"
  let checkClass = "text-green-500"
  let buttonClass = "bg-primary text-primary-foreground hover:bg-primary/90"

  if (designLevel === 'special-gradient' || designLevel === 'special-2' || designLevel === 'special-3') {
    let beamColor = "#f97316" // Orange for special-gradient
    let bgGradient = "from-orange-700 via-orange-500 to-amber-400"
    let iconBg = "bg-white/10"
    let checkIconColor = "text-amber-200"
    let buttonStyle = "bg-white text-orange-600 hover:bg-slate-50"
    let badgeText = "SPECIAL"
    let badgeColor = "bg-white text-orange-600"

    if (designLevel === 'special-2') {
      beamColor = "#06b6d4" // Cyan
      bgGradient = "from-slate-900 via-blue-800 to-cyan-700"
      iconBg = "bg-cyan-500/20"
      checkIconColor = "text-cyan-300"
      buttonStyle = "bg-cyan-500 text-white hover:bg-cyan-400 border-none shadow-[0_0_15px_rgba(6,182,212,0.5)]"
      badgeText = "CYBER VALUE"
      badgeColor = "bg-cyan-500 text-white"
    } else if (designLevel === 'special-3') {
      beamColor = "#fbbf24" // Amber/Gold
      bgGradient = "from-zinc-950 via-indigo-950 to-amber-900"
      iconBg = "bg-amber-500/20"
      checkIconColor = "text-amber-400"
      buttonStyle = "bg-amber-500 text-white hover:bg-amber-400 border-none shadow-[0_0_20px_rgba(251,191,36,0.4)]"
      badgeText = "ELITE PREMIUM"
      badgeColor = "bg-amber-500 text-white"
    }

    return (
      <div className={`group relative p-[2px] overflow-hidden rounded-2xl transition-all duration-500 ${!isComingSoon ? "hover:-translate-y-2 shadow-2xl" : "opacity-90 grayscale-[0.2]"} h-full`}>
        <div 
          className={`absolute inset-[-1000%] ${!isComingSoon ? "animate-spin-slow" : ""} opacity-90`} 
          style={{ backgroundImage: `conic-gradient(from_0deg,transparent_0deg,transparent_310deg,${beamColor}_340deg,transparent_360deg)` }}
        />
        <div className={`relative flex h-full w-full flex-col overflow-hidden rounded-[calc(1rem-2px)] bg-gradient-to-br ${bgGradient}`}>
          <div className={`flex flex-col items-center gap-1 px-5 ${isCompact ? 'py-2 pt-4' : 'py-3 pt-6'} bg-transparent relative`}>
            {designLevel !== 'special-gradient' && (
              <div className={`absolute top-0 right-0 ${badgeColor} ${isCompact ? 'text-[7px] px-1.5 py-0.5' : 'text-[8px] px-3 py-1'} font-black rounded-bl-lg uppercase tracking-widest shadow-lg z-10`}>
                {badgeText}
              </div>
            )}
            <div className={`flex ${isCompact ? 'h-6 w-6' : 'h-10 w-10'} items-center justify-center rounded-full ${iconBg} text-white ring-2 ring-white/20 shadow-xl backdrop-blur-sm`}>
              {pkg.users_limit > 1 ? <Users className={`${isCompact ? 'h-3 w-3' : 'h-5 w-5'}`} /> : <BookOpen className={`${isCompact ? 'h-3 w-3' : 'h-5 w-5'}`} />}
            </div>
            <h3 className={`${isCompact ? 'text-[11px]' : 'text-sm'} font-bold text-center px-4 text-white drop-shadow-sm leading-tight`}>{title}</h3>
            {title === "Minors - 5th Year Bundle" && (
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-orange-600 border border-white/20 text-[10px] font-black shadow-lg animate-pulse transition-all">
                <Star className="h-3 w-3 fill-current shrink-0" />
                OPENS ON 6TH OF MAY
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <p className={`${isCompact ? 'text-xl' : 'text-2xl'} font-black text-white drop-shadow-sm leading-none`}>
                {pkg.price} <span className="text-[10px] font-normal text-white/80">JOD</span>
              </p>
              {hasDiscount && (
                <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-white/50 line-through decoration-white/40 font-medium`}>
                  {pkg.original_price} JOD
                </p>
              )}
            </div>
            {hasDiscount && (
               <div className={`mt-0.5 ${isCompact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]'} font-black bg-white text-orange-600 rounded-full shadow-lg z-10`}>
                  SAVE {discountPercentage}%
               </div>
            )}
            {!hasDiscount && <p className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-white/80 font-medium leading-none ${isCompact ? 'mt-1' : ''}`}>{pkg.users_limit} user{pkg.users_limit > 1 ? "s" : ""}</p>}
            {hasDiscount && <p className={`${isCompact ? 'text-[8px]' : 'text-[9px]'} text-white/60 font-medium leading-none mt-1`}>{pkg.users_limit} user{pkg.users_limit > 1 ? "s" : ""}</p>}
          </div>

          <div className={`flex-1 bg-white/5 backdrop-blur-md px-4 ${isCompact ? 'py-2' : 'py-3'}`}>
            <h4 className="mb-2 text-[9px] font-black uppercase tracking-widest text-white/60">
                Included Courses
            </h4>
            <div className={`grid ${pkg.courses.length > 6 ? 'grid-cols-2 gap-x-2 gap-y-1' : (isCompact ? 'gap-1' : 'gap-1.5')} mb-4`}>
                {pkg.courses.map(course => (
                <div key={course.id} className={`flex items-center justify-between rounded-lg border border-white/5 bg-white/5 ${isCompact ? 'p-1 px-1.5' : 'p-1.5 px-2'} transition-colors hover:bg-white/10`}>
                    <div className="flex items-center gap-1.5 text-white overflow-hidden">
                        <div className={`flex ${isCompact ? 'h-4 w-4' : 'h-5 w-5'} shrink-0 items-center justify-center rounded-md bg-black/20 text-[8px] font-bold shadow-sm ring-1 ring-white/10`}>
                            {course.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-bold line-clamp-1`}>{course.name.split('(')[0].trim()}</span>
                    </div>
                </div>
                ))}
            </div>

            <div className={`flex flex-col ${isCompact ? 'gap-0.5' : 'gap-1.5'}`}>
              {(isCompact ? features.slice(0, 2) : features).map(f => (
                <div key={f} className={`flex items-start gap-1.5 ${isCompact ? 'text-[10px]' : 'text-xs'} text-white drop-shadow-sm font-medium`}>
                  <Check className={`mt-0.5 ${isCompact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} shrink-0 ${checkIconColor}`} />
                  <span className="leading-tight">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`px-4 ${isCompact ? 'py-2' : 'py-4'} bg-transparent`}>
             {isComingSoon ? (
                 <div className={`w-full flex items-center justify-center gap-2 bg-white/10 text-white/90 ${isCompact ? 'py-2 text-[10px]' : 'py-3 text-xs'} font-black rounded-lg border border-white/20 backdrop-blur-sm shadow-xl`}>
                    <Star className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} fill-white animate-pulse`} />
                    COMING SOON
                    <Star className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} fill-white animate-pulse`} />
                 </div>
             ) : (
                <Link href={checkoutUrl}>
                    <Button className={`w-full ${isCompact ? 'py-3 text-xs' : 'py-4 text-sm'} shadow-xl font-black rounded-lg border-none transition-all hover:scale-[1.02] ${buttonStyle}`}>
                        Start mastering your finals
                    </Button>
                </Link>
             )}
          </div>
        </div>
      </div>
    )
  }

  if (designLevel === 'deal-same') {
    containerClass = isComingSoon ? "border-blue-200 opacity-90 shadow-sm" : "border-blue-300 shadow-md relative bg-background"
    headerClass = isComingSoon ? "bg-blue-50/50" : "bg-gradient-to-br from-blue-50 to-white"
    iconContainer = isComingSoon ? "bg-blue-100/50 text-blue-400" : "bg-blue-100 text-blue-500 shadow-sm"
    buttonClass = "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
  } else if (designLevel === 'deal-diff') {
    containerClass = isComingSoon ? "border-amber-200 opacity-90 shadow-sm" : "border-amber-300 shadow-lg relative bg-background"
    headerClass = isComingSoon ? "bg-amber-50/50" : "bg-gradient-to-br from-amber-50 via-white to-amber-50"
    iconContainer = isComingSoon ? "bg-amber-100 text-amber-400" : "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200"
    buttonClass = "bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-orange-500/20"
  }

   return (
    <div className={`group flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300 ${!isComingSoon ? "hover:-translate-y-2" : "grayscale-[0.1]"} ${containerClass} h-full`}>
      <div className={`flex flex-col items-center gap-1.5 px-5 ${isCompact ? 'py-2' : 'py-4'} ${headerClass}`}>
        <div className={`flex ${isCompact ? 'h-6 w-6' : 'h-10 w-10'} items-center justify-center rounded-full ${iconContainer}`}>
           {pkg.users_limit > 1 ? <Users className={`${isCompact ? 'h-3 w-3' : 'h-5 w-5'}`} /> : <BookOpen className={`${isCompact ? 'h-3 w-3' : 'h-5 w-5'}`} />}
        </div>
        <h3 className={`${isCompact ? 'text-[11px]' : 'text-sm'} font-bold text-center px-4 ${textClass} leading-tight`}>{title}</h3>
        {title === "Minors - 5th Year Bundle" && (
          <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-secondary/20 text-[10px] font-black shadow-md animate-pulse transition-all">
              <Star className="h-3 w-3 fill-current shrink-0" />
              OPENS ON 6TH OF MAY
          </div>
        )}
        <div className="flex items-baseline gap-2">
            <p className={`${isCompact ? 'text-xl' : 'text-3xl'} font-black ${textClass} leading-none`}>
                {pkg.price} <span className={`text-[10px] font-normal ${textSecondaryClass}`}>JOD</span>
            </p>
            {hasDiscount && (
                <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} ${textSecondaryClass} line-through opacity-50 font-medium`}>
                    {pkg.original_price} JOD
                </p>
            )}
        </div>
        {hasDiscount && (
            <div className={`mt-0.5 ${isCompact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2.5 py-0.5 text-[10px]'} font-black bg-secondary text-secondary-foreground rounded-full shadow-sm`}>
                SAVE {discountPercentage}%
            </div>
        )}
        {!hasDiscount && <p className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} ${textSecondaryClass} ${isCompact ? 'mt-1' : ''}`}>{pkg.users_limit} user{pkg.users_limit > 1 ? "s" : ""}</p>}
        {hasDiscount && <p className={`${isCompact ? 'text-[8px]' : 'text-[9px]'} ${textSecondaryClass} opacity-70 mt-1`}>{pkg.users_limit} user{pkg.users_limit > 1 ? "s" : ""}</p>}
      </div>

      <div className={`flex-1 bg-background px-4 ${isCompact ? 'py-2' : 'py-3'}`}>
          <h4 className="mb-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            Included Courses
          </h4>
          <div className={`grid ${pkg.courses.length > 6 ? 'grid-cols-2 gap-x-2 gap-y-1' : (isCompact ? 'gap-1' : 'gap-1.5')} mb-4`}>
            {pkg.courses.map(course => (
              <div key={course.id} className={`flex items-center justify-between rounded-lg border border-border/50 ${isCompact ? 'p-1 px-1.5' : 'p-1.5 px-2'} transition-colors ${!isComingSoon ? "bg-muted/30 hover:bg-muted/50" : "bg-muted/10"} overflow-hidden`}>
                <div className="flex items-center gap-1.5">
                    <div className={`flex ${isCompact ? 'h-4 w-4' : 'h-5 w-5'} shrink-0 items-center justify-center rounded-md bg-background text-[8px] font-bold text-secondary shadow-sm ring-1 ring-border`}>
                        {course.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-bold text-foreground/80 line-clamp-1`}>
                        {course.name.split('(')[0].trim()}
                    </span>
                </div>
              </div>
            ))}
          </div>

          <div className={`flex flex-col ${isCompact ? 'gap-0.5' : 'gap-1.5'}`}>
             {(isCompact ? features.slice(0, 2) : features).map(f => (
                <div key={f} className={`flex items-start gap-1.5 ${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-muted-foreground`}>
                    <Check className={`mt-0.5 ${isCompact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} shrink-0 ${checkClass}`} />
                    <span className="leading-tight">{f}</span>
                </div>
             ))}
          </div>
      </div>

      <div className={`px-4 ${isCompact ? 'py-2' : 'py-4'}`}>
        {isComingSoon ? (
            <div className={`w-full flex items-center justify-center gap-2 bg-muted/50 text-muted-foreground/70 ${isCompact ? 'py-2 text-[10px]' : 'py-3 text-xs'} font-black rounded-lg border border-dashed border-muted-foreground/20`}>
                <Star className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} opacity-50 fill-muted-foreground/20`} />
                COMING SOON
                <Star className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} opacity-50 fill-muted-foreground/20`} />
            </div>
        ) : (
            <Link href={checkoutUrl}>
                <Button className={`w-full ${isCompact ? 'py-3 text-xs' : 'py-4 text-sm'} font-black rounded-lg transition-all hover:scale-[1.02] ${buttonClass}`}>
                    Start mastering your finals
                    {!isCompact && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
            </Link>
        )}
      </div>
    </div>
  )
}
