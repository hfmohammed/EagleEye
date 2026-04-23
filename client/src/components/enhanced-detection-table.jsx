"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import {
  Search,
  Download,
  Calendar,
  ScanEye,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  TriangleAlert,
  Clock,
  ListOrdered,
  Loader2,
  Copy,
  Video,
  UserRound,
  Layers,
  Tag,
  Zap,
  Timer,
  Percent,
} from "lucide-react"

function rowsMatch(a, b) {
  if (!a || !b) return false
  if (a.row_id && b.row_id) return a.row_id === b.row_id
  return a.timestamp === b.timestamp && a.count === b.count && a.latency_ms === b.latency_ms
}

function sortableValue(row, field) {
  switch (field) {
    case "timestamp":
      return new Date(row.timestamp).getTime()
    case "count":
      return Number(row.count) || 0
    case "person_count":
      return row.person_count != null ? Number(row.person_count) : -1
    case "class_variety":
      return row.class_variety != null ? Number(row.class_variety) : -1
    case "dominant_class":
      return String(row.dominant_class || "").toLowerCase()
    case "camera_id":
      return String(row.camera_id || "").toLowerCase()
    case "fps":
      return row.fps != null && Number.isFinite(Number(row.fps)) ? Number(row.fps) : -1
    case "latency_ms":
      return row.latency_ms != null && Number.isFinite(Number(row.latency_ms)) ? Number(row.latency_ms) : -1
    case "avg_confidence":
      return row.avg_confidence != null && Number.isFinite(Number(row.avg_confidence)) ? Number(row.avg_confidence) : -1
    case "category_summary":
      return String(row.category_summary || "").toLowerCase()
    default:
      return row[field]
  }
}

function fmtFps(v) {
  if (v == null || !Number.isFinite(Number(v))) return "N/A"
  return String(Math.round(Number(v) * 10) / 10)
}

function fmtLatency(v) {
  if (v == null || !Number.isFinite(Number(v))) return "N/A"
  return String(Math.round(Number(v)))
}

function fmtConfPct(v) {
  if (v == null || !Number.isFinite(Number(v))) return "N/A"
  return `${Math.round(Number(v) * 1000) / 10}%`
}

function DetectionTable({ rows = [] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("timestamp")
  const [sortDirection, setSortDirection] = useState("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isLoading] = useState(false)
  const [rowMenu, setRowMenu] = useState(null)
  const rowMenuRef = useRef(null)

  useEffect(() => {
    if (!rowMenu) return
    const close = (e) => {
      const t = e.target
      if (t instanceof Node && rowMenuRef.current?.contains(t)) return
      if (t instanceof Element && t.closest("[data-row-menu-trigger]")) return
      setRowMenu(null)
    }
    const onKey = (e) => {
      if (e.key === "Escape") setRowMenu(null)
    }
    document.addEventListener("mousedown", close)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", close)
      window.removeEventListener("keydown", onKey)
    }
  }, [rowMenu])

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      window.prompt("Copy:", text)
    }
  }

  const csvCell = (v) => {
    const s = v == null ? "" : String(v)
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const openRowMenu = (e, row) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const menuWidth = 200
    const menuHeight = 88
    let left = rect.right - menuWidth
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8))
    let top = rect.bottom + 4
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - 4
    }
    top = Math.max(8, top)
    setRowMenu((prev) => {
      if (prev && rowsMatch(prev.row, row)) return null
      return { top, left, row }
    })
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date),
    }
  }

  const getRelativeTime = (date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const filteredAndSortedData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const filtered = rows.filter((row) => {
      if (!q) return true
      const timestamp = formatTimestamp(row.timestamp)
      const blob = [
        timestamp.date,
        timestamp.time,
        String(row.count),
        String(row.person_count ?? ""),
        String(row.class_variety ?? ""),
        row.dominant_class ?? "",
        row.category_summary ?? "",
        row.camera_id ?? "",
        row.fps != null ? String(row.fps) : "",
        row.latency_ms != null ? String(row.latency_ms) : "",
        row.avg_confidence != null ? String(row.avg_confidence) : "",
        row.stream_index != null ? String(row.stream_index) : "",
      ]
        .join(" ")
        .toLowerCase()
      return blob.includes(q)
    })
    filtered.sort((a, b) => {
      const aValue = sortableValue(a, sortField)
      const bValue = sortableValue(b, sortField)
      if (aValue === bValue) return 0
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      }
      return aValue < bValue ? 1 : -1
    })
    return filtered
  }, [rows, searchTerm, sortField, sortDirection])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const exportData = () => {
    const header = [
      "Timestamp",
      "Date",
      "Time",
      "Camera",
      "StreamIndex",
      "Objects",
      "People",
      "ClassTypes",
      "TopClass",
      "ClassMix",
      "FPS",
      "LatencyMs",
      "AvgConfidence",
    ]
    const csvContent = [
      header,
      ...filteredAndSortedData.map((row) => {
        const formatted = formatTimestamp(row.timestamp)
        return [
          row.timestamp,
          formatted.date,
          formatted.time,
          row.camera_id ?? "",
          row.stream_index ?? "",
          row.count,
          row.person_count ?? "",
          row.class_variety ?? "",
          row.dominant_class ?? "",
          row.category_summary ?? "",
          row.fps ?? "",
          row.latency_ms ?? "",
          row.avg_confidence ?? "",
        ]
      }),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `detection-data-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getSeverityColor = (count) => {
    if (count <= 2) return "text-ee-muted"
    if (count <= 6) return "text-ee-warning"
    if (count <= 10) return "text-ee-warning"
    return "text-ee-critical"
  }

  const getSeverityBg = (count) => {
    if (count <= 2) return "bg-ee-inset ring-ee-border/80"
    if (count <= 6) return "bg-ee-warning/10 ring-ee-warning/35"
    if (count <= 10) return "bg-ee-warning/15 ring-ee-warning/45"
    return "bg-ee-critical/15 ring-ee-critical/40"
  }

  const rowMenuPortal =
    rowMenu &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={rowMenuRef}
        data-row-actions-menu
        className="ee-surface-deep fixed z-[100] min-w-[12.5rem] rounded-sm border border-ee-border py-1 shadow-xl ring-1 ring-ee-border/60"
        style={{ top: rowMenu.top, left: rowMenu.left }}
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left font-mono text-xs text-ee-text hover:bg-ee-inset"
          onClick={() => {
            copyToClipboard(new Date(rowMenu.row.timestamp).toISOString())
            setRowMenu(null)
          }}
        >
          <Copy className="size-3.5 shrink-0 text-ee-muted" strokeWidth={1.75} />
          Copy ISO timestamp
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left font-mono text-xs text-ee-text hover:bg-ee-inset"
          onClick={() => {
            const formatted = formatTimestamp(rowMenu.row.timestamp)
            const r = rowMenu.row
            const line = [
              csvCell(r.timestamp),
              csvCell(formatted.date),
              csvCell(formatted.time),
              csvCell(r.camera_id ?? ""),
              csvCell(r.stream_index ?? ""),
              csvCell(r.count),
              csvCell(r.person_count ?? ""),
              csvCell(r.class_variety ?? ""),
              csvCell(r.dominant_class ?? ""),
              csvCell(r.category_summary ?? ""),
              csvCell(r.fps ?? ""),
              csvCell(r.latency_ms ?? ""),
              csvCell(r.avg_confidence ?? ""),
            ].join(",")
            copyToClipboard(line)
            setRowMenu(null)
          }}
        >
          <Copy className="size-3.5 shrink-0 text-ee-muted" strokeWidth={1.75} />
          Copy row (CSV)
        </button>
      </div>,
      document.body,
    )

  return (
    <div className="ee-surface-deep overflow-hidden rounded-sm border border-ee-border">
      <div className="border-b border-ee-border p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-ee-border bg-ee-base text-ee-accent">
              <ListOrdered className="size-4" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold uppercase tracking-[0.16em] text-ee-text">Detection log</h2>
              <p className="font-mono text-[11px] text-ee-muted">{filteredAndSortedData.length} events indexed</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ee-muted" />
            <input
              type="text"
              placeholder="Search time, camera, counts, classes, FPS, latency…"
              className="w-full rounded-sm border border-ee-border bg-ee-base py-2 pl-10 pr-3 font-mono text-sm text-ee-text placeholder:text-ee-muted focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-sm border border-ee-border bg-ee-base px-3 py-2 font-mono text-sm text-ee-text focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>

            <button
              type="button"
              onClick={exportData}
              className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-ee-border bg-ee-inset px-3 py-2 font-mono text-sm font-medium text-ee-text transition-colors hover:border-ee-muted hover:bg-ee-inset/90"
            >
              <Download className="size-4" strokeWidth={1.75} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 p-12 text-ee-muted">
            <Loader2 className="size-7 animate-spin rounded-sm text-ee-accent" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="p-12 text-center">
            <TriangleAlert className="mx-auto mb-3 size-10 text-ee-warning" strokeWidth={1.5} />
            <h3 className="mb-1 font-display text-sm font-bold uppercase tracking-wider text-ee-text">No records</h3>
            <p className="font-mono text-xs text-ee-muted">
              {searchTerm ? "Adjust filters or search terms." : "Stand by. Events appear when the feed is live."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px]">
              <thead>
                <tr className="border-b border-ee-border bg-ee-base/50 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-ee-muted">
                  <th className="cursor-pointer select-none px-3 py-3 hover:bg-ee-elevate/70" onClick={() => handleSort("timestamp")}>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5 shrink-0" />
                      Time
                      {sortField === "timestamp" &&
                        (sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-3 hover:bg-ee-elevate/70" onClick={() => handleSort("camera_id")}>
                    <span className="inline-flex items-center gap-1.5">
                      <Video className="size-3.5 shrink-0" />
                      Stream
                      {sortField === "camera_id" &&
                        (sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-3 hover:bg-ee-elevate/70" onClick={() => handleSort("count")}>
                    <span className="inline-flex items-center gap-1.5">
                      <ScanEye className="size-3.5 shrink-0" />
                      Objects
                      {sortField === "count" &&
                        (sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-3 hover:bg-ee-elevate/70" onClick={() => handleSort("person_count")}>
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="size-3.5 shrink-0" />
                      People
                      {sortField === "person_count" &&
                        (sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-3 hover:bg-ee-elevate/70" onClick={() => handleSort("class_variety")}>
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="size-3.5 shrink-0" />
                      Types
                      {sortField === "class_variety" &&
                        (sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-3 hover:bg-ee-elevate/70" onClick={() => handleSort("dominant_class")}>
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="size-3.5 shrink-0" />
                      Top
                      {sortField === "dominant_class" &&
                        (sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-3 hover:bg-ee-elevate/70" onClick={() => handleSort("category_summary")}>
                    <span className="inline-flex items-center gap-1.5">
                      Mix
                      {sortField === "category_summary" &&
                        (sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-3 hover:bg-ee-elevate/70" onClick={() => handleSort("fps")}>
                    <span className="inline-flex items-center gap-1.5">
                      <Zap className="size-3.5 shrink-0" />
                      FPS
                      {sortField === "fps" &&
                        (sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-3 hover:bg-ee-elevate/70" onClick={() => handleSort("latency_ms")}>
                    <span className="inline-flex items-center gap-1.5">
                      <Timer className="size-3.5 shrink-0" />
                      Lat ms
                      {sortField === "latency_ms" &&
                        (sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-3 hover:bg-ee-elevate/70" onClick={() => handleSort("avg_confidence")}>
                    <span className="inline-flex items-center gap-1.5">
                      <Percent className="size-3.5 shrink-0" />
                      Conf
                      {sortField === "avg_confidence" &&
                        (sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </span>
                  </th>
                  <th className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 shrink-0" />
                      Rel
                    </span>
                  </th>
                  <th className="px-3 py-3 text-center text-ee-muted">&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ee-border">
                {paginatedData.map((row, index) => {
                  const formatted = formatTimestamp(row.timestamp)
                  const rowKey = row.row_id ?? `legacy-${row.timestamp}-${startIndex + index}`
                  const mixTitle = row.category_summary || ""
                  const topTitle = row.dominant_class || ""
                  return (
                    <tr key={rowKey} className="group text-sm hover:bg-ee-elevate/40">
                      <td className="px-3 py-3">
                        <span className="font-medium text-ee-text">{formatted.date}</span>
                        <span className="mt-0.5 block text-xs text-ee-muted tabular-nums">{formatted.time}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block max-w-[7rem] truncate font-mono text-xs text-ee-text" title={row.camera_id || ""}>
                          {row.camera_id || "N/A"}
                        </span>
                        {row.stream_index != null && (
                          <span className="block font-mono text-[10px] text-ee-muted tabular-nums">#{row.stream_index}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex min-w-[2rem] items-center justify-center rounded-sm px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ring-1 ${getSeverityBg(row.count)} ${getSeverityColor(row.count)}`}
                          >
                            {row.count}
                          </span>
                          {row.count > 6 && row.count <= 10 && (
                            <TriangleAlert className="size-4 shrink-0 text-ee-warning" aria-hidden />
                          )}
                          {row.count > 10 && <TriangleAlert className="size-4 shrink-0 text-ee-critical" aria-hidden />}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs tabular-nums text-ee-text">
                        {row.person_count != null ? row.person_count : "N/A"}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs tabular-nums text-ee-muted">
                        {row.class_variety != null ? row.class_variety : "N/A"}
                      </td>
                      <td className="px-3 py-3">
                        <span className="block max-w-[5.5rem] truncate font-mono text-xs text-ee-text" title={topTitle}>
                          {row.dominant_class || "N/A"}
                        </span>
                      </td>
                      <td className="max-w-[9rem] px-3 py-3">
                        <span className="block truncate font-mono text-[11px] text-ee-muted" title={mixTitle}>
                          {row.category_summary || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs tabular-nums text-ee-text">{fmtFps(row.fps)}</td>
                      <td className="px-3 py-3 font-mono text-xs tabular-nums text-ee-text">{fmtLatency(row.latency_ms)}</td>
                      <td className="px-3 py-3 font-mono text-xs tabular-nums text-ee-muted">{fmtConfPct(row.avg_confidence)}</td>
                      <td className="px-3 py-3 text-ee-muted tabular-nums">{formatted.relative}</td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          data-row-menu-trigger
                          className="inline-flex cursor-pointer rounded-sm p-1.5 text-ee-muted opacity-0 transition-opacity hover:bg-ee-inset hover:text-ee-text group-hover:opacity-100 focus:opacity-100"
                          aria-label="Row actions"
                          aria-expanded={!!(rowMenu && rowsMatch(rowMenu.row, row))}
                          aria-haspopup="menu"
                          onClick={(e) => openRowMenu(e, row)}
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-ee-border px-4 py-3 text-sm text-ee-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular-nums">
            {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of{" "}
            {filteredAndSortedData.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="cursor-pointer rounded-sm border border-ee-border px-3 py-1.5 font-mono text-xs text-ee-text hover:bg-ee-inset disabled:opacity-40"
            >
              Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) pageNum = i + 1
                else if (currentPage <= 3) pageNum = i + 1
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = currentPage - 2 + i
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-9 cursor-pointer rounded-sm px-2 py-1.5 font-mono text-xs tabular-nums ${
                      currentPage === pageNum
                        ? "bg-ee-inset text-ee-text ring-1 ring-ee-accent/35"
                        : "text-ee-muted hover:bg-ee-inset"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="cursor-pointer rounded-sm border border-ee-border px-3 py-1.5 font-mono text-xs text-ee-text hover:bg-ee-inset disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-ee-border bg-ee-base/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ee-muted">
        <span className="tabular-nums">Last sync {new Date().toLocaleTimeString()}</span>
      </div>

      {rowMenuPortal}
    </div>
  )
}

export default DetectionTable
