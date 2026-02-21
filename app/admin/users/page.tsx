"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PaginationControls } from "@/components/pagination-controls"
import { Search, ShieldBan, ShieldCheck, Eye, Loader2, X } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error(); return r.json() })
const PAGE_SIZE = 20

interface UserRow {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  role: string
  active: boolean
}

interface UserDetail {
  user: UserRow & { role_id: number }
  subscriptions: { id: number; date: string; duration: number; active: boolean; course_name: string; price: number }[]
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [detailId, setDetailId] = useState<number | null>(null)
  const [toggling, setToggling] = useState<number | null>(null)

  const apiUrl = `/api/admin/users?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`
  const { data, isLoading } = useSWR<{ users: UserRow[]; total: number; page: number; limit: number }>(
    apiUrl, fetcher, { revalidateOnFocus: false }
  )

  const { data: detail } = useSWR<UserDetail>(
    detailId ? `/api/admin/users/${detailId}` : null,
    fetcher, { revalidateOnFocus: false }
  )

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  async function toggleBan(userId: number, currentActive: boolean) {
    setToggling(userId)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      })
      mutate(apiUrl)
    } catch { /* ignore */ }
    setToggling(null)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Users Management</h1>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username, email, or name..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Username</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
              ) : data?.users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No users found</td></tr>
              ) : (
                data?.users.map(user => (
                  <tr key={user.id} className="border-b border-border transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{user.id}</td>
                    <td className="px-4 py-3 font-medium">{user.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={user.active ? "destructive" : "outline"}
                        className="h-7 text-xs"
                        disabled={toggling === user.id}
                        onClick={() => toggleBan(user.id, user.active)}
                      >
                        {toggling === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : user.active ? (
                          <><ShieldBan className="mr-1 h-3 w-3" />Ban</>
                        ) : (
                          <><ShieldCheck className="mr-1 h-3 w-3" />Unban</>
                        )}
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDetailId(user.id)}>
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

      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetailId(null)}>
          <div className="mx-4 w-full max-w-lg rounded-lg bg-background p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">User Details</h2>
              <button onClick={() => setDetailId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            {!detail ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">ID:</span> <span className="font-medium">{detail.user.id}</span></div>
                  <div><span className="text-muted-foreground">Username:</span> <span className="font-medium">{detail.user.username}</span></div>
                  <div><span className="text-muted-foreground">First Name:</span> <span className="font-medium">{detail.user.first_name || "-"}</span></div>
                  <div><span className="text-muted-foreground">Last Name:</span> <span className="font-medium">{detail.user.last_name || "-"}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{detail.user.email || "-"}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{detail.user.phone || "-"}</span></div>
                  <div><span className="text-muted-foreground">Role:</span> <span className="font-medium">{detail.user.role}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className={`font-medium ${detail.user.active ? "text-green-600" : "text-destructive"}`}>{detail.user.active ? "Active" : "Banned"}</span></div>
                </div>
                {detail.subscriptions.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">Subscriptions ({detail.subscriptions.length})</h3>
                    <div className="max-h-40 overflow-y-auto rounded border border-border">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-muted/50"><th className="px-2 py-1 text-left">Course</th><th className="px-2 py-1 text-left">Date</th><th className="px-2 py-1 text-left">Status</th></tr></thead>
                        <tbody>
                          {detail.subscriptions.map(s => (
                            <tr key={s.id} className="border-t border-border">
                              <td className="px-2 py-1">{s.course_name}</td>
                              <td className="px-2 py-1">{new Date(s.date).toLocaleDateString()}</td>
                              <td className="px-2 py-1"><span className={s.active ? "text-green-600" : "text-destructive"}>{s.active ? "Active" : "Inactive"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
