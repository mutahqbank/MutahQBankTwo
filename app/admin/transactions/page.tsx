"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/pagination-controls"
import { Eye, Loader2, X, ToggleLeft, ToggleRight } from "lucide-react"

// Global SWRProvider handles fetching and caching rules.
const PAGE_SIZE = 20

interface TransactionRow {
  id: number
  username: string
  course_name: string
  amount: number
  date: string
  accepted: boolean
  note: string | null
  coupon: string | null
  screenshot: string | null
  public_id: string | null
  package_price: number
  package_duration: number
}

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1)
  const [detailTx, setDetailTx] = useState<TransactionRow | null>(null)
  const [toggling, setToggling] = useState<number | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const apiUrl = `/api/admin/transactions?page=${page}&limit=${PAGE_SIZE}`
  const { data, isLoading } = useSWR<{ transactions: TransactionRow[]; total: number }>(apiUrl)

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  const filteredTransactions = data?.transactions.filter(tx => {
    if (!startDate && !endDate) return true;
    const tDate = new Date(tx.date)
    tDate.setHours(0, 0, 0, 0)

    if (startDate) {
      const sDate = new Date(startDate)
      sDate.setHours(0, 0, 0, 0)
      if (tDate < sDate) return false
    }
    if (endDate) {
      const eDate = new Date(endDate)
      eDate.setHours(0, 0, 0, 0)
      if (tDate > eDate) return false
    }
    return true
  }) || []

  async function toggleAccepted(tx: TransactionRow) {
    setToggling(tx.id)
    try {
      await fetch(`/api/admin/transactions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tx.id, accepted: !tx.accepted }),
      })
      mutate(apiUrl)
    } catch { /* ignore */ }
    setToggling(null)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Transactions</h1>

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        {(startDate || endDate) && (
          <Button variant="outline" onClick={() => { setStartDate(""); setEndDate("") }}>
            Clear Filter
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Username</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Course</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount (JOD)</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No transactions found</td></tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="border-b border-border transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{tx.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.course_name}</td>
                    <td className="px-4 py-3 font-mono">{tx.amount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tx.accepted ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {tx.accepted ? "Accepted" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        disabled={toggling === tx.id}
                        onClick={() => toggleAccepted(tx)}
                      >
                        {toggling === tx.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : tx.accepted ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDetailTx(tx)}>
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

      {detailTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetailTx(null)}>
          <div className="mx-4 w-full max-w-lg rounded-lg bg-background p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Transaction Details</h2>
              <button onClick={() => setDetailTx(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">ID:</span> <span className="font-medium">{detailTx.id}</span></div>
              <div><span className="text-muted-foreground">Username:</span> <span className="font-medium">{detailTx.username}</span></div>
              <div><span className="text-muted-foreground">Course:</span> <span className="font-medium">{detailTx.course_name}</span></div>
              <div><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{detailTx.amount} JOD</span></div>
              <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(detailTx.date).toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className={`font-medium ${detailTx.accepted ? "text-green-600" : "text-amber-600"}`}>{detailTx.accepted ? "Accepted" : "Pending"}</span></div>
              <div><span className="text-muted-foreground">Package Price:</span> <span className="font-medium">{detailTx.package_price} JOD</span></div>
              <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{detailTx.package_duration} days</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Coupon:</span> <span className="font-medium">{detailTx.coupon || "None"}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Note:</span> <span className="font-medium">{detailTx.note || "None"}</span></div>
              {detailTx.screenshot && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Screenshot:</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={detailTx.screenshot} alt="Payment screenshot" className="mt-2 max-h-64 rounded border border-border" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
