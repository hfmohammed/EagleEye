"use client"

import { useState, useEffect } from "react"

function EnhancedBarChart({ data, title, subtitle, icon, isLoading = false, height = 300 }) {
  const [animatedData, setAnimatedData] = useState([])
  const [hoveredBar, setHoveredBar] = useState(null)

  // Process data for our custom chart
  const processedData =
    data?.datasets?.[0]?.data?.map((value, index) => ({
      label: data.labels[index],
      value: value,
      color: `hsl(${(index * 60) % 360}, 70%, 60%)`, // Dynamic colors
    })) || []

  const maxValue = Math.max(...processedData.map((d) => d.value), 1)

  // Animation effect
  useEffect(() => {
    if (!isLoading && processedData.length > 0) {
      const timer = setTimeout(() => {
        setAnimatedData(processedData)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, processedData])

  // Gradient definitions for bars
  const gradients = [
    { from: "#3b82f6", to: "#1d4ed8" }, // blue
    { from: "#10b981", to: "#047857" }, // emerald
    { from: "#f59e0b", to: "#d97706" }, // amber
    { from: "#ef4444", to: "#dc2626" }, // red
    { from: "#8b5cf6", to: "#7c3aed" }, // violet
    { from: "#ec4899", to: "#db2777" }, // pink
  ]

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-6 flex-1 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-3xl hover:border-slate-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
          </div>
        </div>

        {/* Status indicator */}
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
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full relative p-4">
            <svg width="100%" height={height} viewBox={`0 0 800 ${height}`} className="overflow-visible">
              {/* Gradient definitions */}
              <defs>
                {gradients.map((gradient, index) => (
                  <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={gradient.from} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={gradient.to} stopOpacity="0.7" />
                  </linearGradient>
                ))}

                {/* Glow effect */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <g key={ratio}>
                  <line
                    x1="60"
                    y1={height - 60 - (height - 120) * ratio}
                    x2="740"
                    y2={height - 60 - (height - 120) * ratio}
                    stroke="rgba(71, 85, 105, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <text
                    x="45"
                    y={height - 60 - (height - 120) * ratio + 4}
                    fill="#94a3b8"
                    fontSize="12"
                    textAnchor="end"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {Math.round(maxValue * ratio)}
                  </text>
                </g>
              ))}

              {/* Bars */}
              {animatedData.map((item, index) => {
                const barWidth = 60
                const barSpacing = (800 - 120) / animatedData.length
                const x = 60 + index * barSpacing + (barSpacing - barWidth) / 2
                const barHeight = (item.value / maxValue) * (height - 120)
                const y = height - 60 - barHeight
                const isHovered = hoveredBar === index

                return (
                  <g key={index}>
                    {/* Bar shadow */}
                    <rect x={x + 2} y={y + 2} width={barWidth} height={barHeight} fill="rgba(0, 0, 0, 0.2)" rx="6" />

                    {/* Main bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={`url(#gradient-${index % gradients.length})`}
                      rx="6"
                      className="transition-all duration-300 cursor-pointer"
                      style={{
                        transform: isHovered ? "scaleY(1.05)" : "scaleY(1)",
                        transformOrigin: "bottom",
                        filter: isHovered ? "url(#glow)" : "none",
                      }}
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    />

                    {/* Value label on hover */}
                    {isHovered && (
                      <g>
                        <rect
                          x={x + barWidth / 2 - 20}
                          y={y - 35}
                          width="40"
                          height="25"
                          fill="rgba(15, 23, 42, 0.95)"
                          rx="4"
                          stroke="rgba(71, 85, 105, 0.5)"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={y - 18}
                          fill="#f1f5f9"
                          fontSize="12"
                          textAnchor="middle"
                          fontWeight="bold"
                          fontFamily="Inter, system-ui, sans-serif"
                        >
                          {item.value}
                        </text>
                      </g>
                    )}

                    {/* Label */}
                    <text
                      x={x + barWidth / 2}
                      y={height - 35}
                      fill="#94a3b8"
                      fontSize="11"
                      textAnchor="middle"
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {item.label}
                    </text>
                  </g>
                )
              })}

              {/* Animated entrance effect */}
              <style>
                {`
                  @keyframes slideUp {
                    from {
                      transform: translateY(100%);
                      opacity: 0;
                    }
                    to {
                      transform: translateY(0);
                      opacity: 1;
                    }
                  }
                  rect {
                    animation: slideUp 0.8s ease-out;
                  }
                `}
              </style>
            </svg>
          </div>
        )}
      </div>

      {/* Legend */}
      {data?.datasets?.length > 1 && (
        <div className="flex flex-wrap gap-4 mb-4">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: gradients[index % gradients.length].from }}
              />
              <span className="text-sm text-slate-300">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer with stats */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Analytics</span>
            </span>
            <span className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Real-time</span>
            </span>
          </div>
          <span className="text-slate-500">Updated {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}

export default EnhancedBarChart
