import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"

interface PackageCardProps {
  title: string
  items?: string[]
  description?: string
  badge?: string
  price?: string
  discount?: string
  ctaText: string
  href: string
  isPopular?: boolean
}

export function PackageCard({
  title,
  items,
  description,
  badge,
  price,
  discount,
  ctaText,
  href,
  isPopular,
}: PackageCardProps) {
  return (
    <div className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isPopular ? "border-secondary ring-1 ring-secondary/20 shadow-lg" : "border-border shadow-sm"}`}>
      {badge && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-secondary-foreground shadow-sm">
          {badge}
        </div>
      )}

      <div className="flex flex-1 flex-col p-8">
        <h3 className="mb-4 text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>

        {description && (
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}

        {items && (
          <ul className="mb-8 space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span className="text-sm text-foreground/80 leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto">
          {price && (
            <div className="mb-6 flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{price}</span>
              {discount && (
                <span className="text-sm font-medium text-muted-foreground line-through opacity-60">
                  {discount}
                </span>
              )}
            </div>
          )}

          <Link
            href={href}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all active:scale-95 ${
              isPopular
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {ctaText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
