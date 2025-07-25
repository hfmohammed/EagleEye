"use client"

import { useState, useEffect } from "react"

function EnhancedLineChart({ data, title, subtitle, icon, isLoading = false, height = 300 }) {
  const [animatedData, setAnimatedData] = useState([])
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // Create unique ID for this chart instance
  const chartId = `chart-${title.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`

  // Process data for our custom chart
  const processedData =
    data?.datasets?.[0]?.data?.map((value, index) => ({
      label: data.labels[index],
      value: value,
      x: index,
    })) || []

  const maxValue = Math.max(...processedData.map((d) => d.value), 1)
  const minValue = Math.min(...processedData.map((d) => d.value), 0)
  const valueRange = maxValue - minValue || 1

  // Animation effect
  useEffect(() => {
    if (!isLoading && processedData.length > 0) {
      const timer = setTimeout(() => {
        setAnimatedData(processedData)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, processedData])

  // Generate path for the line
  const generatePath = (data) => {
    if (data.length === 0) return ""

    const chartWidth = 680
    const chartHeight = height - 120
    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0

    return data
      .map((point, index) => {
        const x = 60 + index * stepX
        const y = height - 60 - ((point.value - minValue) / valueRange) * chartHeight
        return `${index === 0 ? "M" : "L"} ${x} ${y}`
      })
      .join(" ")
  }

  // Generate area path
  const generateAreaPath = (data) => {
    if (data.length === 0) return ""

    const linePath = generatePath(data)
    const chartWidth = 680
    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0
    const bottomY = height - 60

    const lastX = data.length > 1 ? 60 + (data.length - 1) * stepX : 60
    return `${linePath} L ${lastX} ${bottomY} L 60 ${bottomY} Z`
  }

  // Generate grid values
  const gridValues = Array.from({ length: 5 }, (_, i) => {
    const ratio = i / 4
    return minValue + valueRange * ratio
  })

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-6 flex-1 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-3xl hover:border-slate-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">Live</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full relative p-4">
            <svg width="100%" height={height} viewBox={`0 0 800 ${height}`} className="overflow-visible">
              <defs>
                {/* Unique gradient for line */}
                <linearGradient id={`lineGradient-${chartId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                  <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
                </linearGradient>

                {/* Unique gradient for area */}
                <linearGradient id={`areaGradient-${chartId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                </linearGradient>

                {/* Glow effect */}
                <filter id={`lineGlow-${chartId}`}>
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid lines */}
              {gridValues.map((value, index) => {
                const y = height - 60 - ((value - minValue) / valueRange) * (height - 120)
                return (
                  <g key={index}>
                    <line
                      x1="60"
                      y1={y}
                      x2="740"
                      y2={y}
                      stroke="rgba(71, 85, 105, 0.3)"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <text
                      x="45"
                      y={y + 4}
                      fill="#94a3b8"
                      fontSize="12"
                      textAnchor="end"
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {Math.round(value * 100) / 100}
                    </text>
                  </g>
                )
              })}

              {/* Area fill */}
              {animatedData.length > 0 && (
                <path
                  d={generateAreaPath(animatedData)}
                  fill={`url(#areaGradient-${chartId})`}
                  className="transition-all duration-1000"
                />
              )}

              {/* Main line */}
              {animatedData.length > 0 && (
                <path
                  d={generatePath(animatedData)}
                  fill="none"
                  stroke={`url(#lineGradient-${chartId})`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#lineGlow-${chartId})`}
                  className="transition-all duration-1000"
                />
              )}

              {/* Data points */}
              {animatedData.map((point, index) => {
                const chartWidth = 680
                const chartHeight = height - 120
                const stepX = animatedData.length > 1 ? chartWidth / (animatedData.length - 1) : 0
                const x = 60 + index * stepX
                const y = height - 60 - ((point.value - minValue) / valueRange) * chartHeight
                const isHovered = hoveredPoint === index

                return (
                  <g key={index}>
                    {/* Point glow */}
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill="rgba(139, 92, 246, 0.2)"
                        className="transition-all duration-200"
                      />
                    )}

                    {/* Main point - invisible but interactive */}
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth="2"
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* Visible point only on hover */}
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="#8b5cf6"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-200"
                      />
                    )}

                    {/* Value tooltip */}
                    {isHovered && (
                      <g>
                        <rect
                          x={x - 30}
                          y={y - 45}
                          width="60"
                          height="30"
                          fill="rgba(15, 23, 42, 0.95)"
                          rx="6"
                          stroke="rgba(139, 92, 246, 0.5)"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={y - 32}
                          fill="#f1f5f9"
                          fontSize="12"
                          textAnchor="middle"
                          fontWeight="bold"
                          fontFamily="Inter, system-ui, sans-serif"
                        >
                          {Math.round(point.value * 100) / 100}
                        </text>
                        <text
                          x={x}
                          y={y - 20}
                          fill="#cbd5e1"
                          fontSize="10"
                          textAnchor="middle"
                          fontFamily="Inter, system-ui, sans-serif"
                        >
                          {point.label}
                        </text>
                      </g>
                    )}

                    {/* X-axis labels - show every few labels to avoid crowding */}
                    {index % Math.max(1, Math.ceil(animatedData.length / 6)) === 0 && (
                      <text
                        x={x}
                        y={height - 35}
                        fill="#94a3b8"
                        fontSize="11"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {point.label}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Trend indicator */}
              {animatedData.length > 1 && (
                <g>
                  {(() => {
                    const firstValue = animatedData[0].value
                    const lastValue = animatedData[animatedData.length - 1].value
                    const trend = lastValue > firstValue ? "up" : lastValue < firstValue ? "down" : "stable"
                    const trendColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#6b7280"

                    return (
                      <g>
                        <rect x="650" y="80" width="80" height="25" fill="rgba(15, 23, 42, 0.8)" rx="4" />
                        <text x="690" y="97" fill={trendColor} fontSize="12" textAnchor="middle" fontWeight="bold">
                          {trend === "up" ? "↗ " : trend === "down" ? "↘ " : "→ "}
                          {trend.toUpperCase()}
                        </text>
                      </g>
                    )
                  })()}
                </g>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Trending</span>
            </span>
            {animatedData.length > 0 && (
              <>
                <span className="flex items-center space-x-1">
                  <span>Min: {Math.round(minValue * 100) / 100}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>Max: {Math.round(maxValue * 100) / 100}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>
                    Avg:{" "}
                    {Math.round((animatedData.reduce((sum, d) => sum + d.value, 0) / animatedData.length) * 100) / 100}
                  </span>
                </span>
              </>
            )}
          </div>
          <span className="text-slate-500">Updated {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}

export default EnhancedLineChart
