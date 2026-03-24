"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Announcement {
    id: number
    title: string
    description: string
    target_date: string
    button_text: string
    button_link: string
    is_active: boolean
}

export default function AdminAnnouncementPage() {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchAnnouncement()
    }, [])

    async function fetchAnnouncement() {
        try {
            const res = await fetch("/api/admin/announcement")
            if (res.ok) {
                const data = await res.json()
                if (data) {
                    // Format date for datetime-local input
                    const date = new Date(data.target_date)
                    const formattedDate = date.toISOString().slice(0, 16)
                    setAnnouncement({ ...data, target_date: formattedDate })
                }
            }
        } catch (error) {
            console.error("Failed to fetch announcement:", error)
            toast.error("Failed to load announcement")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSave() {
        if (!announcement) return

        setIsSaving(true)
        try {
            const res = await fetch("/api/admin/announcement", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(announcement),
            })

            if (res.ok) {
                toast.success("Announcement updated successfully")
                router.refresh()
            } else {
                toast.error("Failed to update announcement")
            }
        } catch (error) {
            console.error("Failed to save announcement:", error)
            toast.error("Error saving announcement")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!announcement) {
        return (
            <div className="p-8 text-center">
                <p>No announcement found in database.</p>
                <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Announcement Management</h1>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <Card className="border-border shadow-md">
                <CardHeader>
                    <CardTitle>Edit Floating Announcement</CardTitle>
                    <CardDescription>
                        Modify the global announcement that appears to all users.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="is-active">Active Status</Label>
                            <p className="text-sm text-balance text-muted-foreground">
                                Enable or disable the announcement globally.
                            </p>
                        </div>
                        <Switch
                            id="is-active"
                            checked={announcement.is_active}
                            onCheckedChange={(checked) => setAnnouncement({ ...announcement, is_active: checked })}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={announcement.title}
                                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                placeholder="e.g., Final Exam Special Package"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="target-date">Countdown Target Date</Label>
                            <Input
                                id="target-date"
                                type="datetime-local"
                                value={announcement.target_date}
                                onChange={(e) => setAnnouncement({ ...announcement, target_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            className="min-h-[100px]"
                            value={announcement.description}
                            onChange={(e) => setAnnouncement({ ...announcement, description: e.target.value })}
                            placeholder="Describe the offer..."
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="button-text">Button Text</Label>
                            <Input
                                id="button-text"
                                value={announcement.button_text}
                                onChange={(e) => setAnnouncement({ ...announcement, button_text: e.target.value })}
                                placeholder="e.g., Explore Package"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="button-link">Button Link</Label>
                            <Input
                                id="button-link"
                                value={announcement.button_link}
                                onChange={(e) => setAnnouncement({ ...announcement, button_link: e.target.value })}
                                placeholder="e.g., /subscriptions"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6">
                    <p className="text-sm text-muted-foreground">
                        Last updated: {new Date().toLocaleString()}
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
