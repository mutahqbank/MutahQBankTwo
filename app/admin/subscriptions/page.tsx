"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/pagination-controls"
import { Loader2, ToggleLeft, ToggleRight } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error(); return r.json() })
const PAGE_SIZE = 20

interface SubscriptionRow {
  id: number
  username: string
  course_name: string
  date: string
  duration: number
  active: boolean
}

export default function AdminSubscriptionsPage() {
  const [page, setPage] = useState(1)
  const [toggling, setToggling] = useState<number | null>(null)

  const apiUrl = `/api/admin/subscriptions?page=${page}&limit=${PAGE_SIZE}`
  const { data, isLoading } = useSWR<{ subscriptions: SubscriptionRow[]; total: number }>(apiUrl, fetcher, { revalidateOnFocus: false })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  async function toggleActive(sub: SubscriptionRow) {
    setToggling(sub.id)
    try {
      await fetch(`/api/admin/subscriptions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sub.id, active: !sub.active }),
      })
      mutate(apiUrl)
    } catch { /* ignore */ }
    setToggling(null)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Subscriptions</h1>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Username</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Course</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subscription Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
              ) : data?.subscriptions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No subscriptions found</td></tr>
              ) : (
                data?.subscriptions.map(sub => (
                  <tr key={sub.id} className="border-b border-border transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{sub.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sub.course_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(sub.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sub.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {sub.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        disabled={toggling === sub.id}
                        onClick={() => toggleActive(sub)}
                      >
                        {toggling === sub.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : sub.active ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} totalPages={totalPages} total={data?.total || 0} onPageChange={setPage} />
      </div>
    </div>
  )
}
