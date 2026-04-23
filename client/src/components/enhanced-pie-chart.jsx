"use client"

import { useState, useEffect } from "react"
import { PieChart as PieChartIcon, Clock } from "lucide-react"

function EnhancedPieChart({ data, title, subtitle, icon, isLoading = false, height = 300 }) {
  const [animatedData, setAnimatedData] = useState([])
  const [hoveredSlice, setHoveredSlice] = useState(null)

  const processedData =
    data?.datasets?.[0]?.data?.map((value, index) => ({
      label: data.labels[index],
      value: value,
      color:
        data.datasets[0].backgroundColor[index] ||
        ["#39FF6A", "#2a8f4a", "#6B7368", "#3d4a42", "#252b28", "#161A18"][index % 6],
    })) || []

  const total = processedData.reduce((sum, item) => sum + item.value, 0)

  useEffect(() => {
    if (!isLoading && processedData.length > 0) {
      const timer = setTimeout(() => setAnimatedData(processedData), 80)
      return () => clearTimeout(timer)
    }
  }, [isLoading, processedData])

  const calculateSlicePath = (startAngle, endAngle, radius, innerRadius = 0) => {
    const centerX = 150
    const centerY = 150
    const x1 = centerX + radius * Math.cos(startAngle)
    const y1 = centerY + radius * Math.sin(startAngle)
    const x2 = centerX + radius * Math.cos(endAngle)
    const y2 = centerY + radius * Math.sin(endAngle)
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1"
    if (innerRadius === 0) {
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    }
    const x3 = centerX + innerRadius * Math.cos(endAngle)
    const y3 = centerY + innerRadius * Math.sin(endAngle)
    const x4 = centerX + innerRadius * Math.cos(startAngle)
    const y4 = centerY + innerRadius * Math.sin(startAngle)
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`
  }

  return (
    <div
      className="ee-surface-deep flex flex-1 flex-col overflow-hidden rounded-sm border border-ee-border p-3 md:p-4"
      style={{ minHeight: height }}
    >
      <div className="mb-2 flex min-w-0 items-center gap-2.5">
        {icon && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-ee-border bg-ee-base text-ee-accent">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="font-display truncate text-sm font-bold uppercase tracking-[0.14em] text-ee-text">{title}</h2>
          {subtitle && <p className="truncate font-mono text-[11px] text-ee-muted">{subtitle}</p>}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-ee-muted">
            <div className="size-7 animate-spin rounded-sm border-2 border-ee-border border-t-ee-accent" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-6 lg:flex-row">
            <div className="relative shrink-0">
              <svg width="280" height="280" viewBox="0 0 300 300" className="overflow-visible">
                <defs>
                  {animatedData.map((item, index) => (
                    <linearGradient key={index} id={`pie-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={item.color} stopOpacity="0.95" />
                      <stop offset="100%" stopColor={item.color} stopOpacity="0.75" />
                    </linearGradient>
                  ))}
                </defs>

                {total > 0 &&
                  animatedData.map((item, index) => {
                    let currentAngle = -Math.PI / 2
                    for (let i = 0; i < index; i++) {
                      currentAngle += (animatedData[i].value / total) * 2 * Math.PI
                    }
                    const sliceAngle = (item.value / total) * 2 * Math.PI
                    const endAngle = currentAngle + sliceAngle
                    const isHovered = hoveredSlice === index
                    const radius = isHovered ? 108 : 100
                    const innerRadius = 42

                    return (
                      <path
                        key={index}
                        d={calculateSlicePath(currentAngle, endAngle, radius, innerRadius)}
                        fill={`url(#pie-${index})`}
                        stroke="#0D0F0E"
                        strokeWidth="1.5"
                        className="cursor-pointer transition-opacity"
                        style={{ opacity: isHovered ? 1 : 0.92 }}
                        onMouseEnter={() => setHoveredSlice(index)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    )
                  })}

                <circle cx="150" cy="150" r="36" fill="#111510" stroke="#252b28" strokeWidth="1" />
                {hoveredSlice === null && total > 0 && (
                  <g>
                    <text
                      x="150"
                      y="148"
                      fill="#E8EAE8"
                      fontSize="20"
                      textAnchor="middle"
                      fontWeight="700"
                      fontFamily="ui-monospace, monospace"
                    >
                      {total}
                    </text>
                    <text x="150" y="168" fill="#6B7368" fontSize="12" textAnchor="middle" fontFamily="ui-monospace, monospace">
                      total
                    </text>
                  </g>
                )}
                {hoveredSlice != null && animatedData[hoveredSlice] && (
                  <g>
                    <text
                      x="150"
                      y="142"
                      fill="#E8EAE8"
                      fontSize="19"
                      textAnchor="middle"
                      fontWeight="700"
                      fontFamily="ui-monospace, monospace"
                    >
                      {animatedData[hoveredSlice].value}
                    </text>
                    <text
                      x="150"
                      y="164"
                      fill="#6B7368"
                      fontSize="13"
                      textAnchor="middle"
                      fontFamily="ui-monospace, monospace"
                    >
                      {animatedData[hoveredSlice].label}
                    </text>
                  </g>
                )}
              </svg>
            </div>

            <div className="w-full max-w-xs space-y-2">
              {animatedData.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-sm border px-3 py-2 text-left font-mono text-sm transition-colors ${
                    hoveredSlice === index ? "border-ee-border bg-ee-inset/80" : "border-ee-border/80 bg-ee-base/40 hover:border-ee-border"
                  }`}
                  onMouseEnter={() => setHoveredSlice(index)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <span className="size-2.5 shrink-0 rounded-sm ring-1 ring-ee-border" style={{ backgroundColor: item.color }} />
                  <span className="min-w-0 flex-1 truncate text-ee-text">{item.label}</span>
                  <span className="shrink-0 tabular-nums text-ee-muted">
                    {item.value}
                    {total > 0 ? ` (${Math.round((item.value / total) * 100)}%)` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-ee-border pt-3 font-mono text-sm text-ee-muted">
        <span className="inline-flex items-center gap-1.5 text-ee-muted">
          <PieChartIcon className="size-4" strokeWidth={1.75} />
          Distribution
        </span>
        <span className="inline-flex items-center gap-1.5 tabular-nums text-ee-muted">
          <Clock className="size-4" strokeWidth={1.75} />
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}

export default EnhancedPieChart
