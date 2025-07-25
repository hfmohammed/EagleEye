"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Download,
  Calendar,
  Eye,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  AlertTriangle,
  Clock,
  Database,
} from "lucide-react"

function DetectionTable({ rows = [] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("timestamp")
  const [sortDirection, setSortDirection] = useState("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date),
    }
  }

  // Get relative time
  const getRelativeTime = (date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const filtered = rows.filter((row) => {
      const timestamp = formatTimestamp(row.timestamp)
      return (
        timestamp.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timestamp.time.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.count.toString().includes(searchTerm)
      )
    })

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === "timestamp") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [rows, searchTerm, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Export data
  const exportData = () => {
    const csvContent = [
      ["Timestamp", "Date", "Time", "Object Count"],
      ...filteredAndSortedData.map((row) => {
        const formatted = formatTimestamp(row.timestamp)
        return [row.timestamp, formatted.date, formatted.time, row.count]
      }),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `detection-data-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get severity color based on count
  const getSeverityColor = (count) => {
    if (count === 0) return "text-slate-400"
    if (count <= 2) return "text-green-400"
    if (count <= 5) return "text-yellow-400"
    if (count <= 10) return "text-orange-400"
    return "text-red-400"
  }

  const getSeverityBg = (count) => {
    if (count === 0) return "bg-slate-500/20"
    if (count <= 2) return "bg-green-500/20"
    if (count <= 5) return "bg-yellow-500/20"
    if (count <= 10) return "bg-orange-500/20"
    return "bg-red-500/20"
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Detection History</h2>
              <p className="text-sm text-slate-400">{filteredAndSortedData.length} total detections</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">Live Data</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search detections..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Items per page */}
          <select
            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>

          {/* Export button */}
          <button
            onClick={exportData}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading detection data...</p>
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Detections Found</h3>
            <p className="text-slate-400">
              {searchTerm ? "Try adjusting your search terms" : "No detection data available"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600/50 transition-colors"
                    onClick={() => handleSort("timestamp")}
                  >
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Timestamp</span>
                      {sortField === "timestamp" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600/50 transition-colors"
                    onClick={() => handleSort("count")}
                  >
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Objects Detected</span>
                      {sortField === "count" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Relative Time</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {paginatedData.map((row, index) => {
                  const formatted = formatTimestamp(row.timestamp)
                  return (
                    <tr key={index} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{formatted.date}</span>
                          <span className="text-xs text-slate-400">{formatted.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBg(row.count)} ${getSeverityColor(row.count)}`}
                          >
                            {row.count}
                          </span>
                          {row.count > 10 && <AlertTriangle className="w-4 h-4 text-red-400" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">{formatted.relative}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-600 rounded">
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of{" "}
            {filteredAndSortedData.length} results
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      currentPage === pageNum
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="px-6 py-4 bg-slate-700/30 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Database className="w-3 h-3" />
              <span>Detection Log</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Real-time Updates</span>
            </span>
          </div>
          <span className="text-slate-500">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}

export default DetectionTable
