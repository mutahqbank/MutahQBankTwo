"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/pagination-controls"
import { Eye, Loader2, X } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error(); return r.json() })
const PAGE_SIZE = 20

interface FeedRow {
  id: number
  username: string
  question_text: string | null
  feed_type: string | null
  content: string | null
  date: string
  question_id: number | null
  user_id: number
}

export default function AdminFeedsPage() {
  const [page, setPage] = useState(1)
  const [detailFeed, setDetailFeed] = useState<FeedRow | null>(null)

  const { data, isLoading } = useSWR<{ feeds: FeedRow[]; total: number }>(
    `/api/admin/feeds?page=${page}&limit=${PAGE_SIZE}`,
    fetcher, { revalidateOnFocus: false }
  )

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  function truncate(text: string | null, max: number) {
    if (!text) return "-"
    return text.length > max ? text.substring(0, max) + "..." : text
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Feeds</h1>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Username</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Question</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Feed</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
              ) : data?.feeds.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No feeds found</td></tr>
              ) : (
                data?.feeds.map(feed => (
                  <tr key={feed.id} className="border-b border-border transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{feed.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{truncate(feed.question_text, 50)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{truncate(feed.content, 60)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(feed.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDetailFeed(feed)}>
                        <Eye className="mr-1 h-3 w-3" />Details
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

      {detailFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetailFeed(null)}>
          <div className="mx-4 w-full max-w-lg rounded-lg bg-background p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Feed Details</h2>
              <button onClick={() => setDetailFeed(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <div><span className="text-muted-foreground">ID:</span> <span className="font-medium">{detailFeed.id}</span></div>
              <div><span className="text-muted-foreground">Username:</span> <span className="font-medium">{detailFeed.username}</span></div>
              <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{detailFeed.feed_type || "-"}</span></div>
              <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(detailFeed.date).toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">Question ID:</span> <span className="font-medium">{detailFeed.question_id || "-"}</span></div>
              {detailFeed.question_text && (
                <div>
                  <span className="text-muted-foreground">Question:</span>
                  <p className="mt-1 rounded bg-muted/50 p-3 text-sm leading-relaxed">{detailFeed.question_text}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Content:</span>
                <p className="mt-1 rounded bg-muted/50 p-3 text-sm leading-relaxed">{detailFeed.content || "No content"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
