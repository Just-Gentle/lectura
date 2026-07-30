"use client"

import { Search, X } from "lucide-react"
import { useMemo, useState } from "react"
import type { Lecture } from "@/lib/db/schema"
import { LectureCard } from "@/components/lecture-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "ready", label: "Ready" },
  { value: "pending", label: "Not generated" },
  { value: "processing", label: "Generating" },
  { value: "failed", label: "Failed" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
  { value: "longest", label: "Most pages" },
]

const NO_COURSE = "__none__"

export function LectureBrowser({ lectures }: { lectures: Lecture[] }) {
  const [query, setQuery] = useState("")
  const [course, setCourse] = useState("all")
  const [status, setStatus] = useState("all")
  const [sort, setSort] = useState("newest")

  const courses = useMemo(() => {
    const names = new Set<string>()
    let hasUncategorised = false
    for (const lecture of lectures) {
      if (lecture.courseName) names.add(lecture.courseName)
      else hasUncategorised = true
    }
    return { names: [...names].sort((a, b) => a.localeCompare(b)), hasUncategorised }
  }, [lectures])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    const matches = lectures.filter((lecture) => {
      if (status !== "all" && lecture.status !== status) return false
      if (course === NO_COURSE && lecture.courseName) return false
      if (course !== "all" && course !== NO_COURSE && lecture.courseName !== course) {
        return false
      }
      if (!needle) return true
      return (
        lecture.title.toLowerCase().includes(needle) ||
        (lecture.courseName ?? "").toLowerCase().includes(needle) ||
        lecture.fileName.toLowerCase().includes(needle)
      )
    })

    const sorted = [...matches]
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return +new Date(a.createdAt) - +new Date(b.createdAt)
        case "title":
          return a.title.localeCompare(b.title)
        case "longest":
          return b.pageCount - a.pageCount
        default:
          return +new Date(b.createdAt) - +new Date(a.createdAt)
      }
    })
    return sorted
  }, [lectures, query, course, status, sort])

  const filtersActive = query.trim() !== "" || course !== "all" || status !== "all"

  function reset() {
    setQuery("")
    setCourse("all")
    setStatus("all")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="lecture-search" className="sr-only">
            Search lectures
          </label>
          <Input
            id="lecture-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, course, or file name"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {(courses.names.length > 0 || courses.hasUncategorised) && (
            <Select
              value={course}
              onValueChange={(value) => setCourse(value ?? "all")}
            >
              <SelectTrigger className="h-9 w-40" aria-label="Filter by course">
                <SelectValue>
                  {(value: string) =>
                    value === "all"
                      ? "All courses"
                      : value === NO_COURSE
                        ? "No course"
                        : value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.names.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
                {courses.hasUncategorised && (
                  <SelectItem value={NO_COURSE}>No course</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}

          <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
            <SelectTrigger className="h-9 w-40" aria-label="Filter by status">
              <SelectValue>
                {(value: string) =>
                  STATUS_OPTIONS.find((option) => option.value === value)?.label ??
                  "Status"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value) => setSort(value ?? "newest")}>
            <SelectTrigger className="h-9 w-40" aria-label="Sort lectures">
              <SelectValue>
                {(value: string) =>
                  SORT_OPTIONS.find((option) => option.value === value)?.label ??
                  "Sort"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {filtered.length} of {lectures.length}{" "}
          {lectures.length === 1 ? "lecture" : "lectures"}
        </p>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <p className="text-sm font-medium">No lectures match those filters</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different search term or clear the filters.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lecture) => (
            <li key={lecture.id}>
              <LectureCard lecture={lecture} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
