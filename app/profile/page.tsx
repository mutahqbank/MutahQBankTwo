"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Check, AlertCircle } from "lucide-react"

export default function StudentProfilePage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [pwLoading, setPwLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [pwMessage, setPwMessage] = useState("")
    const [error, setError] = useState("")
    const [pwError, setPwError] = useState("")

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    useEffect(() => {
        if (user) {
            const names = (user.full_name || "").split(" ")
            setFirstName(names[0] || "")
            setLastName(names.slice(1).join(" ") || "")
            setUsername(user.username || "")
            setEmail(user.email || "")
            setPhone(user.phone || "")
        }
    }, [user])

    async function handleProfileUpdate(e: React.FormEvent) {
        e.preventDefault()
        if (!user) return
        setLoading(true)
        setMessage("")
        setError("")

        try {
            const res = await fetch(`/api/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ first_name: firstName, last_name: lastName, username, email, phone }),
            })
            if (!res.ok) {
                const data = await res.json()
                setError(data.error || "Failed to update profile")
            } else {
                setMessage("Profile updated successfully")
                // Trigger a fake revalidation by calling the hook to refresh user data if necessary
                // Auth context will re-check `/api/auth/me` next reload or we can rely on immediate update
            }
        } catch {
            setError("Failed to update profile")
        }
        setLoading(false)
    }

    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault()
        if (!user) return

        if (!currentPassword) {
            setPwError("Current password is required")
            return
        }
        if (newPassword !== confirmPassword) {
            setPwError("New passwords do not match")
            return
        }
        if (newPassword.length < 4) {
            setPwError("Password must be at least 4 characters")
            return
        }

        setPwLoading(true)
        setPwMessage("")
        setPwError("")

        try {
            const res = await fetch(`/api/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
            })
            if (!res.ok) {
                const data = await res.json()
                setPwError(data.error || "Failed to change password")
            } else {
                setPwMessage("Password changed successfully")
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            }
        } catch {
            setPwError("Failed to change password")
        }
        setPwLoading(false)
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-8 text-2xl font-bold text-foreground">Profile Settings</h1>

            {/* Profile Form */}
            <form onSubmit={handleProfileUpdate} className="mb-10 rounded-lg border border-border p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Personal Information</h2>
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>

                    {message && (
                        <div className="flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-500">
                            <Check className="h-4 w-4 shrink-0" /> {message}
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive dark:text-red-500">
                            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="self-start mt-2">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>

            {/* Password Form */}
            <form onSubmit={handlePasswordChange} className="rounded-lg border border-border p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Change Password</h2>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>

                    {pwMessage && (
                        <div className="flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-500">
                            <Check className="h-4 w-4 shrink-0" /> {pwMessage}
                        </div>
                    )}
                    {pwError && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive dark:text-red-500">
                            <AlertCircle className="h-4 w-4 shrink-0" /> {pwError}
                        </div>
                    )}

                    <Button type="submit" disabled={pwLoading} variant="secondary" className="self-start mt-2 border text-white border-secondary hover:bg-secondary/10  hover:text-black">
                        {pwLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Change Password
                    </Button>
                </div>
            </form>
        </div>
    )
}
