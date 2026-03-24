"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Save, ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Package {
    id: number
    price: number
    users_limit: number
    duration: number
    active: boolean
    custom_name: string | null
    design_level: string | null
    courses: string[]
    is_featured: boolean
    order: number | null
}

export default function AdminFeaturedPackagesPage() {
    const [packages, setPackages] = useState<Package[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchPackages()
    }, [])

    async function fetchPackages() {
        try {
            const res = await fetch("/api/admin/homepage/featured-packages")
            if (res.ok) {
                const data = await res.json()
                setPackages(data)
            }
        } catch (error) {
            console.error("Failed to fetch packages:", error)
            toast.error("Failed to load packages")
        } finally {
            setIsLoading(false)
        }
    }

    const featuredPackages = packages.filter(p => p.is_featured).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const availablePackages = packages.filter(p => !p.is_featured)

    async function handleSave() {
        setIsSaving(true)
        try {
            const packageIds = featuredPackages.map(p => p.id)
            const res = await fetch("/api/admin/homepage/featured-packages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageIds }),
            })

            if (res.ok) {
                toast.success("Featured packages updated")
            } else {
                toast.error("Failed to update featured packages")
            }
        } catch (error) {
            console.error("Failed to save featured packages:", error)
            toast.error("Error saving featured packages")
        } finally {
            setIsSaving(false)
        }
    }

    const toggleFeatured = (id: number) => {
        setPackages(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, is_featured: !p.is_featured, order: !p.is_featured ? (featuredPackages.length) : null }
            }
            return p
        }))
    }

    const moveOrder = (id: number, direction: 'up' | 'down') => {
        const featured = [...featuredPackages]
        const index = featured.findIndex(p => p.id === id)
        if (index === -1) return
        
        if (direction === 'up' && index > 0) {
            [featured[index], featured[index - 1]] = [featured[index - 1], featured[index]]
        } else if (direction === 'down' && index < featured.length - 1) {
            [featured[index], featured[index + 1]] = [featured[index + 1], featured[index]]
        }

        // Update orders
        const newPackages = [...packages]
        featured.forEach((p, idx) => {
            const pkg = newPackages.find(np => np.id === p.id)
            if (pkg) pkg.order = idx
        })
        setPackages(newPackages)
    }

    const togglePackageActive = async (id: number, currentStatus: boolean) => {
        try {
            const res = await fetch("/api/admin/homepage/featured-packages", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId: id, active: !currentStatus }),
            })

            if (res.ok) {
                setPackages(prev => prev.map(p => {
                    if (p.id === id) return { ...p, active: !currentStatus }
                    return p
                }))
                toast.success(`Package ${!currentStatus ? 'activated' : 'deactivated'}`)
            } else {
                toast.error("Failed to update package status")
            }
        } catch (error) {
            console.error("Failed to toggle package status:", error)
            toast.error("Error updating package status")
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Featured Study Bundles</h1>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Selection
                </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Current Selection */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">Homepage Display Order</h2>
                    <p className="text-sm text-balance text-muted-foreground">
                        Drag and drop is simulated here with up/down arrows. These will appear on the homepage in this order. <strong className="text-secondary/80">Inactive packages will display as "Coming Soon" on the homepage.</strong>
                    </p>
                    
                    {featuredPackages.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
                            <p className="text-muted-foreground">No packages selected. The homepage will show "Coming Soon" fallbacks.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {featuredPackages.map((pkg, idx) => (
                                <Card key={pkg.id} className="relative overflow-hidden border-secondary/20 shadow-sm transition-all hover:border-secondary/50">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="flex flex-col gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6" 
                                                onClick={() => moveOrder(pkg.id, 'up')}
                                                disabled={idx === 0}
                                            >
                                                <GripVertical className="h-4 w-4 rotate-0" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6" 
                                                onClick={() => moveOrder(pkg.id, 'down')}
                                                disabled={idx === featuredPackages.length - 1}
                                            >
                                                <GripVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-foreground line-clamp-1">
                                                {pkg.custom_name || `Package #${pkg.id}`}
                                            </h4>
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {pkg.courses.join(", ")}
                                            </p>
                                            <div className="mt-1 flex gap-2 items-center">
                                                <span className="text-xs font-semibold text-secondary">{pkg.price} JOD</span>
                                                <span className="text-xs text-muted-foreground">{pkg.users_limit > 1 ? "Group" : "Individual"}</span>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className={`ml-auto h-6 px-2 text-[10px] font-bold uppercase transition-all ${
                                                        !pkg.active 
                                                        ? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" 
                                                        : "border-green-500/30 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                    }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        togglePackageActive(pkg.id, pkg.active);
                                                    }}
                                                >
                                                    {pkg.active ? "Active" : "Inactive"}
                                                </Button>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => toggleFeatured(pkg.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Packages */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">Available Packages</h2>
                    <p className="text-sm text-balance text-muted-foreground">
                        Select from any subscription packages (active or inactive) to feature them on the homepage.
                    </p>
                    
                    <div className="max-h-[600px] overflow-y-auto pr-2">
                        <div className="grid gap-3">
                            {availablePackages.map(pkg => (
                                <Card 
                                    key={pkg.id} 
                                    className="cursor-pointer transition-colors hover:bg-muted/30"
                                    onClick={() => toggleFeatured(pkg.id)}
                                >
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <Checkbox 
                                            checked={false} 
                                            onCheckedChange={() => toggleFeatured(pkg.id)}
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-foreground">
                                                {pkg.custom_name || `Package #${pkg.id}`}
                                            </h4>
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {pkg.courses.join(", ")}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-foreground">{pkg.price} JOD</p>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                {pkg.users_limit} User{pkg.users_limit > 1 ? "s" : ""}
                                            </p>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className={`mt-1 h-6 px-2 text-[10px] font-bold uppercase transition-all ${
                                                    !pkg.active 
                                                    ? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" 
                                                    : "border-green-500/30 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePackageActive(pkg.id, pkg.active);
                                                }}
                                            >
                                                {pkg.active ? "Active" : "Inactive"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {availablePackages.length === 0 && (
                                <p className="py-8 text-center text-sm text-muted-foreground">No more available packages.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
