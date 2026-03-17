"use strict"

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Search, 
  Trash2, 
  BookOpen, 
  Shield, 
  UserPlus, 
  Loader2,
  Check,
  X,
  MoreVertical,
  ShieldAlert
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Course {
  id: number
  name: string
  slug: string
}

interface Instructor {
  id: number
  first_name: string
  last_name: string
  email: string
  username: string
  role: string
  allowed_courses: string[]
  active: boolean
}

interface UserSearch {
  id: number
  first_name: string
  last_name: string
  email: string
  username: string
  role: string
}

export default function InstructorsPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Promotion Dialog State
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearch[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserSearch | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Manage Courses Dialog State
  const [manageOpen, setManageOpen] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
    }
  }, [isAdmin, authLoading, router])

  useEffect(() => {
    fetchInstructors()
    fetchCourses()
  }, [])

  const fetchInstructors = async () => {
    try {
      const res = await fetch("/api/admin/instructors")
      const data = await res.json()
      setInstructors(data)
    } catch (error) {
      toast.error("Failed to fetch instructors")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses/all")
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      console.error("Failed to fetch courses")
    }
  }

  const handleSearchUsers = async () => {
    if (!userSearch.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(`/api/admin/instructors?mode=search&search=${encodeURIComponent(userSearch)}`)
      const data = await res.json()
      setSearchResults(data)
    } catch (error) {
      toast.error("Search failed")
    } finally {
      setIsSearching(false)
    }
  }

  const handlePromote = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      const selectedCourseNames = courses
        .filter(c => selectedCourses.includes(c.id))
        .map(c => c.name)

      const res = await fetch("/api/admin/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          allowedCourses: selectedCourseNames
        })
      })

      if (res.ok) {
        toast.success("User promoted to instructor")
        setPromoteOpen(false)
        setSelectedUser(null)
        setSelectedCourses([])
        setUserSearch("")
        setSearchResults([])
        fetchInstructors()
      } else {
        const data = await res.json()
        toast.error(data.error || "Promotion failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCourses = async () => {
    if (!editingInstructor) return
    setIsSubmitting(true)
    try {
      const selectedCourseNames = courses
        .filter(c => selectedCourses.includes(c.id))
        .map(c => c.name)

      const res = await fetch(`/api/admin/instructors/${editingInstructor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedCourses: selectedCourseNames
        })
      })

      if (res.ok) {
        toast.success("Instructor courses updated")
        setManageOpen(false)
        setEditingInstructor(null)
        setSelectedCourses([])
        fetchInstructors()
      } else {
        toast.error("Failed to update courses")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemote = async (id: number) => {
    if (!confirm("Are you sure you want to demote this instructor to a regular user?")) return
    try {
      const res = await fetch(`/api/admin/instructors/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Instructor demoted")
        fetchInstructors()
      } else {
        toast.error("Demotion failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const toggleCourse = (courseId: number) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId) 
        : [...prev, courseId]
    )
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instructor Management</h1>
          <p className="text-muted-foreground">Manage instructor roles and course assignments.</p>
        </div>
        
        <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Promote User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Promote User to Instructor</DialogTitle>
              <DialogDescription>
                Search for an existing user and assign them courses.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {!selectedUser ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, or username..."
                        className="pl-9"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                      />
                    </div>
                    <Button onClick={handleSearchUsers} disabled={isSearching}>
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                    </Button>
                  </div>
                  
                  <div className="max-h-[200px] overflow-auto rounded-md border">
                    <Table>
                      <TableBody>
                        {searchResults.length > 0 ? (
                          searchResults.map((u) => (
                            <TableRow 
                              key={u.id} 
                              className="cursor-pointer hover:bg-muted"
                              onClick={() => setSelectedUser(u)}
                            >
                              <TableCell>
                                <div className="font-medium">{u.first_name} {u.last_name}</div>
                                <div className="text-xs text-muted-foreground">@{u.username} • {u.email}</div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline">{u.role}</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell className="text-center text-muted-foreground py-8">
                              {userSearch ? "No users found" : "Search to find users to promote"}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card className="bg-muted/50 border-none">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-full p-2">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{selectedUser.first_name} {selectedUser.last_name}</CardTitle>
                            <CardDescription>@{selectedUser.username}</CardDescription>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
                      </div>
                    </CardHeader>
                  </Card>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Assign Courses</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-auto p-1">
                      {courses.map((course) => (
                        <div key={course.id} className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/50 transition-colors">
                          <Checkbox 
                            id={`course-${course.id}`} 
                            checked={selectedCourses.includes(course.id)}
                            onCheckedChange={() => toggleCourse(course.id)}
                          />
                          <label 
                            htmlFor={`course-${course.id}`}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            {course.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
              <Button 
                onClick={handlePromote} 
                disabled={!selectedUser || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Promote to Instructor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Instructor</TableHead>
                <TableHead>Assigned Courses</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 w-32 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-full animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="ml-auto h-5 w-8 animate-pulse rounded bg-muted" /></TableCell>
                  </TableRow>
                ))
              ) : instructors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No instructors found. Promote a user to get started.
                  </TableCell>
                </TableRow>
              ) : (
                instructors.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell>
                      <div className="font-medium">{inst.first_name} {inst.last_name}</div>
                      <div className="text-xs text-muted-foreground">@{inst.username}</div>
                      <div className="text-xs text-muted-foreground">{inst.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {inst.allowed_courses && inst.allowed_courses.length > 0 ? (
                          inst.allowed_courses.map((c, i) => (
                            <Badge key={i} variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/20">
                              {c}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No courses assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {inst.active ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200">Active</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200">Blocked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setEditingInstructor(inst)
                            const instCourseIds = courses
                              .filter(c => inst.allowed_courses.includes(c.name))
                              .map(c => c.id)
                            setSelectedCourses(instCourseIds)
                            setManageOpen(true)
                          }}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Manage Courses
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDemote(inst.id)}
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Demote to User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manage Courses Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Manage Assigned Courses</DialogTitle>
            <DialogDescription>
              Assign or remove courses for {editingInstructor?.first_name} {editingInstructor?.last_name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-auto p-1">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/50 transition-colors">
                  <Checkbox 
                    id={`manage-course-${course.id}`} 
                    checked={selectedCourses.includes(course.id)}
                    onCheckedChange={() => toggleCourse(course.id)}
                  />
                  <label 
                    htmlFor={`manage-course-${course.id}`}
                    className="text-sm font-medium leading-none cursor-pointer flex-1"
                  >
                    {course.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCourses} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
