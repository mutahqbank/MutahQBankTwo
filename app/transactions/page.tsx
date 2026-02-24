"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Receipt } from "lucide-react"

interface Transaction {
    id: number
    course_name: string
    amount: string
    date: string
    accepted: boolean | null
    package_price: string
    package_duration: number
}

export default function StudentTransactionsPage() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function fetchTransactions() {
            try {
                const res = await fetch("/api/transactions")
                if (!res.ok) throw new Error("Failed to fetch transactions")
                const data = await res.json()
                setTransactions(data.transactions)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchTransactions()
        }
    }, [user])

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="flex items-center text-3xl font-bold tracking-tight text-foreground">
                        <Receipt className="mr-3 h-8 w-8 text-primary" />
                        My Transactions
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        View your purchase history and transaction status
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm font-medium text-destructive">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#05223A] text-white">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Package / Course</th>
                                <th className="px-6 py-4 font-semibold">Amount</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="transition-colors hover:bg-muted/50">
                                        <td className="whitespace-nowrap px-6 py-4 text-foreground font-medium">
                                            {new Date(tx.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-foreground">{tx.course_name}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            ${tx.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tx.accepted === true
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                                                        : tx.accepted === false
                                                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500"
                                                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                                                    }`}
                                            >
                                                {tx.accepted === true ? "Approved" : tx.accepted === false ? "Rejected" : "Pending"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
