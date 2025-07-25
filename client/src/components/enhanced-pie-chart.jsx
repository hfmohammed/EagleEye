"use client"

import { useState, useEffect } from "react"

function EnhancedPieChart({ data, title, subtitle, icon, isLoading = false, height = 300 }) {
  const [animatedData, setAnimatedData] = useState([])
  const [hoveredSlice, setHoveredSlice] = useState(null)

  // Process data for our custom chart
  const processedData =
    data?.datasets?.[0]?.data?.map((value, index) => ({
      label: data.labels[index],
      value: value,
      color: data.datasets[0].backgroundColor[index] || `hsl(${(index * 60) % 360}, 70%, 60%)`,
    })) || []

  const total = processedData.reduce((sum, item) => sum + item.value, 0)

  // Animation effect
  useEffect(() => {
    if (!isLoading && processedData.length > 0) {
      const timer = setTimeout(() => {
        setAnimatedData(processedData)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, processedData])

  // Calculate slice paths
  const calculateSlicePath = (startAngle, endAngle, radius, innerRadius = 0) => {
    const centerX = 150
    const centerY = 150

    const x1 = centerX + radius * Math.cos(startAngle)
    const y1 = centerY + radius * Math.sin(startAngle)
    const x2 = centerX + radius * Math.cos(endAngle)
    const y2 = centerY + radius * Math.sin(endAngle)

    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1"

    if (innerRadius === 0) {
      // Pie chart
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    } else {
      // Donut chart
      const x3 = centerX + innerRadius * Math.cos(endAngle)
      const y3 = centerY + innerRadius * Math.sin(endAngle)
      const x4 = centerX + innerRadius * Math.cos(startAngle)
      const y4 = centerY + innerRadius * Math.sin(startAngle)

      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`
    }
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-6 flex-1 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-3xl hover:border-slate-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
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
              <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="flex items-center space-x-8">
              {/* Chart */}
              <div className="relative">
                <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
                  <defs>
                    {animatedData.map((item, index) => (
                      <linearGradient key={index} id={`pieGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={item.color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={item.color} stopOpacity="0.6" />
                      </linearGradient>
                    ))}

                    <filter id="pieGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {animatedData.map((item, index) => {
                    let currentAngle = -Math.PI / 2 // Start from top
                    for (let i = 0; i < index; i++) {
                      currentAngle += (animatedData[i].value / total) * 2 * Math.PI
                    }
                    const sliceAngle = (item.value / total) * 2 * Math.PI
                    const endAngle = currentAngle + sliceAngle
                    const isHovered = hoveredSlice === index

                    const radius = isHovered ? 110 : 100
                    const innerRadius = 40

                    return (
                      <g key={index}>
                        {/* Slice shadow */}
                        <path
                          d={calculateSlicePath(currentAngle, endAngle, radius + 2, innerRadius)}
                          fill="rgba(0, 0, 0, 0.2)"
                          transform="translate(2, 2)"
                        />

                        {/* Main slice */}
                        <path
                          d={calculateSlicePath(currentAngle, endAngle, radius, innerRadius)}
                          fill={`url(#pieGradient-${index})`}
                          stroke="#1e293b"
                          strokeWidth="2"
                          className="transition-all duration-300 cursor-pointer"
                          style={{
                            filter: isHovered ? "url(#pieGlow)" : "none",
                          }}
                          onMouseEnter={() => setHoveredSlice(index)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />

                        {/* Value label */}
                        {isHovered && (
                          <g>
                            <text
                              x="150"
                              y="145"
                              fill="#f1f5f9"
                              fontSize="18"
                              textAnchor="middle"
                              fontWeight="bold"
                              fontFamily="Inter, system-ui, sans-serif"
                            >
                              {item.value}
                            </text>
                            <text
                              x="150"
                              y="165"
                              fill="#cbd5e1"
                              fontSize="12"
                              textAnchor="middle"
                              fontFamily="Inter, system-ui, sans-serif"
                            >
                              {item.label}
                            </text>
                          </g>
                        )}
                      </g>
                    )
                  })}

                  {/* Center circle */}
                  <circle
                    cx="150"
                    cy="150"
                    r="35"
                    fill="rgba(15, 23, 42, 0.8)"
                    stroke="rgba(71, 85, 105, 0.5)"
                    strokeWidth="2"
                  />

                  {/* Total in center */}
                  {!hoveredSlice && (
                    <g>
                      <text
                        x="150"
                        y="145"
                        fill="#f1f5f9"
                        fontSize="16"
                        textAnchor="middle"
                        fontWeight="bold"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {total}
                      </text>
                      <text
                        x="150"
                        y="165"
                        fill="#cbd5e1"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        TOTAL
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {animatedData.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 cursor-pointer transition-all duration-200 ${
                      hoveredSlice === index ? "transform scale-105" : ""
                    }`}
                    onMouseEnter={() => setHoveredSlice(index)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-slate-400">
                        {item.value} ({Math.round((item.value / total) * 100)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Distribution</span>
            </span>
          </div>
          <span className="text-slate-500">Updated {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}

export default EnhancedPieChart
