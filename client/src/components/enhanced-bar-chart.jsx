"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { TrendingUp, Clock } from "lucide-react"

const BAR_PALETTE = ["#67E8F9", "#39FF6A", "#F5A623", "#E8EAE8", "#6B7368", "#3d4a42"]

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function EnhancedBarChart({ data, title, subtitle, icon, isLoading = false, height = 300 }) {
  const [animatedData, setAnimatedData] = useState([])
  const [hoveredBar, setHoveredBar] = useState(null)
  const [hoverTip, setHoverTip] = useState(null)
  const chartAreaRef = useRef(null)

  const hideBarTip = useCallback(() => {
    setHoveredBar(null)
    setHoverTip(null)
  }, [])

  const showBarTip = useCallback((e, item) => {
    const wrap = chartAreaRef.current
    if (!wrap) return
    const b = wrap.getBoundingClientRect()
    const cx = e.clientX - b.left
    const cy = e.clientY - b.top
    const pad = 72
    const left = Math.min(Math.max(cx, pad), Math.max(pad, b.width - pad))
    setHoverTip({ value: item.value, label: item.label, left, top: cy })
  }, [])

  const processedData = useMemo(
    () =>
      data?.datasets?.[0]?.data?.map((value, index) => ({
        label: data.labels[index] ?? "",
        value: safeNumber(value),
        color: BAR_PALETTE[index % BAR_PALETTE.length],
      })) || [],
    [data],
  )

  const maxValue = useMemo(() => {
    const vals = processedData.map((d) => d.value).filter(Number.isFinite)
    if (!vals.length) return 1
    const hi = Math.max(...vals)
    const headroom = hi > 0 ? hi * 0.08 : 0
    return Math.max(hi + headroom, 1e-3)
  }, [processedData])

  useEffect(() => {
    if (!isLoading && processedData.length > 0) {
      const timer = setTimeout(() => setAnimatedData(processedData), 80)
      return () => clearTimeout(timer)
    }
    setAnimatedData([])
  }, [isLoading, processedData])

  return (
    <div className="ee-surface-deep flex flex-1 flex-col overflow-hidden rounded-sm border border-ee-border p-3 md:p-4">
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
        ) : processedData.length === 0 ? (
          <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <p className="font-mono text-xs text-ee-muted">No bar samples</p>
            <p className="font-mono text-[10px] text-ee-muted/80">Personnel history fills as frames arrive</p>
          </div>
        ) : (
          <div ref={chartAreaRef} className="relative h-full w-full overflow-visible p-1" onMouseLeave={hideBarTip}>
            {hoverTip && (
              <div
                className="pointer-events-none absolute z-20 min-w-[5.75rem] max-w-[min(13rem,calc(100%-1rem))] rounded-sm border border-ee-accent bg-ee-base px-2 py-1 shadow-sm"
                style={{
                  left: hoverTip.left,
                  top: hoverTip.top,
                  transform: "translate(-50%, calc(-100% - 6px))",
                }}
              >
                <p className="font-mono text-base font-bold tabular-nums leading-tight text-ee-text sm:text-lg">
                  {Math.round(hoverTip.value * 100) / 100}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-ee-muted sm:text-[11px]">{hoverTip.label}</p>
              </div>
            )}
            <svg width="100%" height={height} viewBox={`0 0 800 ${height}`} className="overflow-visible">
              <defs>
                {BAR_PALETTE.map((c, index) => (
                  <linearGradient key={index} id={`bar-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={c} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={c} stopOpacity="0.65" />
                  </linearGradient>
                ))}
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <g key={ratio}>
                  <line
                    x1="60"
                    y1={height - 60 - (height - 120) * ratio}
                    x2="740"
                    y2={height - 60 - (height - 120) * ratio}
                    stroke="#252b28"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />
                  <text
                    x="54"
                    y={height - 60 - (height - 120) * ratio + 5}
                    fill="#6B7368"
                    fontSize="13"
                    textAnchor="end"
                    fontFamily="ui-monospace, monospace"
                  >
                    {Math.round(maxValue * ratio)}
                  </text>
                </g>
              ))}

              {animatedData.map((item, index) => {
                const barWidth = 52
                const barSpacing = (800 - 120) / Math.max(animatedData.length, 1)
                const x = 60 + index * barSpacing + (barSpacing - barWidth) / 2
                const barHeight = (Math.max(item.value, 0) / maxValue) * (height - 120)
                const y = height - 60 - barHeight
                const isHovered = hoveredBar === index
                const h = Math.max(barHeight, item.value > 0 ? 4 : 1)

                return (
                  <g key={index}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={h}
                      rx="1"
                      fill={`url(#bar-${index % BAR_PALETTE.length})`}
                      className="cursor-pointer transition-opacity"
                      style={{ opacity: isHovered ? 1 : 0.88 }}
                      onMouseEnter={(e) => {
                        setHoveredBar(index)
                        showBarTip(e, item)
                      }}
                    />
                    <text
                      x={x + barWidth / 2}
                      y={height - 26}
                      fill="#6B7368"
                      fontSize="12"
                      textAnchor="middle"
                      fontFamily="ui-monospace, monospace"
                    >
                      {item.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ee-border pt-3 font-mono text-sm text-ee-muted">
        <span className="inline-flex items-center gap-1.5 text-ee-muted">
          <TrendingUp className="size-4" strokeWidth={1.75} />
          Bars
        </span>
        <span className="inline-flex items-center gap-1.5 tabular-nums text-ee-muted">
          <Clock className="size-4" strokeWidth={1.75} />
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}

export default EnhancedBarChart
