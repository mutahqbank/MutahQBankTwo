"use client"

import Link from "next/link"
import useSWR from "swr"
import { Phone, Mail } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error(); return r.json() })

interface FooterCourse {
  id: number
  name: string
  slug: string
  is_active: boolean
}

export function Footer() {
  const { data: courses } = useSWR<FooterCourse[]>("/api/courses", fetcher, { revalidateOnFocus: false })
  const activeCourses = courses || []

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Column 1: Our Courses */}
          <div>
            <h3 className="mb-4 text-lg font-bold">Our Courses</h3>
            <ul className="flex flex-col gap-1.5">
              {activeCourses.map(course => (
                <li key={course.id}>
                  <Link
                    href={`/course/${course.id}`}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-secondary"
                  >
                    <span className="mr-1.5 text-secondary">{">"}</span>
                    {course.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Contact us */}
          <div>
            <h3 className="mb-4 text-lg font-bold">Contact us</h3>
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-1.5 text-sm font-semibold text-secondary">Message us</p>
                <div className="flex flex-col gap-1">
                  <a href="tel:+962790036378" className="flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    +962 7 9003 6378
                  </a>
                  <a href="tel:+962778101941" className="flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    +962 7 7810 1941
                  </a>
                  <a href="tel:+962796198217" className="flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    +962 7 9619 8217
                  </a>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-secondary">Do you have a message?</p>
                <a href="mailto:mutahqbank@gmail.com" className="flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  mutahqbank@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: Follow us */}
          <div>
            <h3 className="mb-4 text-lg font-bold">Follow us</h3>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/mutahqbank"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a
                href="https://facebook.com/mutahqbank"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href="https://t.me/mutahqbank"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                aria-label="Telegram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0 12 12 0 0011.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 py-4 text-center">
        <p className="text-sm text-primary-foreground/50">
          {"© 2025 mutahQbank. All Rights Reserved"}
        </p>
      </div>
    </footer>
  )
}
