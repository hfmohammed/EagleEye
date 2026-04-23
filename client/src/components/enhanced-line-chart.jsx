"use client"

import { useState, useEffect, useId, useMemo, useRef, useCallback } from "react"
import { TrendingUp, Clock } from "lucide-react"

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function EnhancedLineChart({ data, title, subtitle, icon, isLoading = false, height = 300 }) {
  const [animatedData, setAnimatedData] = useState([])
  const [hoveredPoint, setHoveredPoint] = useState(null)
  /** Pixel-positioned HTML tooltip (SVG text scales unreadably when chart is narrow) */
  const [hoverTip, setHoverTip] = useState(null)
  const chartAreaRef = useRef(null)
  const reactId = useId().replace(/:/g, "")

  const showPointTip = useCallback((e, point) => {
    const wrap = chartAreaRef.current
    if (!wrap) return
    const b = wrap.getBoundingClientRect()
    const cx = e.clientX - b.left
    const cy = e.clientY - b.top
    const pad = 72
    const left = Math.min(Math.max(cx, pad), Math.max(pad, b.width - pad))
    setHoverTip({
      value: point.value,
      label: point.label,
      left,
      top: cy,
    })
  }, [])

  const hidePointTip = useCallback(() => {
    setHoveredPoint(null)
    setHoverTip(null)
  }, [])

  const processedData = useMemo(
    () =>
      data?.datasets?.[0]?.data?.map((value, index) => ({
        label: data.labels[index] ?? "",
        value: safeNumber(value),
        x: index,
      })) || [],
    [data],
  )

  const strokeColor =
    typeof data?.datasets?.[0]?.borderColor === "string" ? data.datasets[0].borderColor : "#6B7368"

  const { minValue, maxValue, valueRange } = useMemo(() => {
    const values = processedData.map((d) => d.value).filter(Number.isFinite)
    if (values.length === 0) {
      return { minValue: 0, maxValue: 1, valueRange: 1 }
    }
    const rawMin = Math.min(...values)
    const rawMax = Math.max(...values)
    const span = rawMax - rawMin
    const pad = span > 0 ? span * 0.12 : Math.max(Math.abs(rawMax) * 0.15, 0.5)
    let minV = rawMin - pad
    let maxV = rawMax + pad
    if (maxV <= minV) maxV = minV + 1e-3
    return { minValue: minV, maxValue: maxV, valueRange: maxV - minV }
  }, [processedData])

  useEffect(() => {
    if (!isLoading && processedData.length > 0) {
      const timer = setTimeout(() => setAnimatedData(processedData), 80)
      return () => clearTimeout(timer)
    }
    setAnimatedData([])
  }, [isLoading, processedData])

  const chartWidth = 680
  const chartHeight = Math.max(height - 120, 80)
  const bottomY = height - 60

  const generatePath = (pts) => {
    if (pts.length === 0) return ""
    if (pts.length === 1) {
      const y = bottomY - ((pts[0].value - minValue) / valueRange) * chartHeight
      return `M 60 ${y} L 740 ${y}`
    }
    const stepX = chartWidth / (pts.length - 1)
    return pts
      .map((point, index) => {
        const x = 60 + index * stepX
        const y = bottomY - ((point.value - minValue) / valueRange) * chartHeight
        return `${index === 0 ? "M" : "L"} ${x} ${y}`
      })
      .join(" ")
  }

  const generateAreaPath = (pts) => {
    if (pts.length === 0) return ""
    if (pts.length === 1) {
      const y = bottomY - ((pts[0].value - minValue) / valueRange) * chartHeight
      return `M 60 ${y} L 740 ${y} L 740 ${bottomY} L 60 ${bottomY} Z`
    }
    const linePath = generatePath(pts)
    const stepX = chartWidth / (pts.length - 1)
    const lastX = 60 + (pts.length - 1) * stepX
    return `${linePath} L ${lastX} ${bottomY} L 60 ${bottomY} Z`
  }

  const gridValues = Array.from({ length: 5 }, (_, i) => {
    const ratio = i / 4
    return minValue + valueRange * ratio
  })

  const lineGradId = `ln-${reactId}`
  const areaGradId = `ar-${reactId}`

  const pointX = (index, total) => {
    if (total <= 1) return 60 + chartWidth / 2
    const stepX = chartWidth / (total - 1)
    return 60 + index * stepX
  }

  const pointY = (value) => bottomY - ((value - minValue) / valueRange) * chartHeight

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
            <p className="font-mono text-xs text-ee-muted">No samples in window</p>
            <p className="font-mono text-[10px] text-ee-muted/80">Data will plot as the feed runs</p>
          </div>
        ) : (
          <div
            ref={chartAreaRef}
            className="relative w-full overflow-visible p-1"
            onMouseLeave={hidePointTip}
          >
            {hoverTip && (
              <div
                className="pointer-events-none absolute z-20 min-w-[5.75rem] max-w-[min(13rem,calc(100%-1rem))] rounded-sm border bg-ee-base px-2 py-1 shadow-sm"
                style={{
                  left: hoverTip.left,
                  top: hoverTip.top,
                  transform: "translate(-50%, calc(-100% - 6px))",
                  borderColor: strokeColor,
                }}
              >
                <p className="font-mono text-base font-bold tabular-nums leading-tight text-ee-text sm:text-lg">
                  {Math.round(hoverTip.value * 100) / 100}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-ee-muted sm:text-[11px]">{hoverTip.label}</p>
              </div>
            )}
            {animatedData.length > 1 && (
              <div className="pointer-events-none absolute right-1 top-1 z-10 max-w-[calc(100%-0.5rem)] rounded-sm border border-ee-border bg-ee-base/95 px-1.5 py-0.5 text-right shadow-sm backdrop-blur-sm">
                {(() => {
                  const firstValue = animatedData[0].value
                  const lastValue = animatedData[animatedData.length - 1].value
                  const fmt = (v) => Math.round(v * 100) / 100
                  const delta = lastValue - firstValue
                  const deltaColor =
                    delta > 0 ? "text-ee-accent" : delta < 0 ? "text-ee-critical" : "text-ee-muted"
                  return (
                    <>
                      <p className="font-mono text-[9px] font-semibold tabular-nums text-ee-text sm:text-[10px]">
                        {fmt(firstValue)} → {fmt(lastValue)}
                      </p>
                      <p className={`font-mono text-[11px] font-bold tabular-nums sm:text-xs ${deltaColor}`}>
                        Δ {delta >= 0 ? "+" : ""}
                        {fmt(delta)}
                      </p>
                    </>
                  )
                })()}
              </div>
            )}
            <svg width="100%" height={height} viewBox={`0 0 800 ${height}`} className="overflow-visible">
              <defs>
                <linearGradient id={lineGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="1" />
                </linearGradient>
                <linearGradient id={areaGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                </linearGradient>
              </defs>

              {gridValues.map((value, index) => {
                const y = bottomY - ((value - minValue) / valueRange) * chartHeight
                return (
                  <g key={index}>
                    <line
                      x1="60"
                      y1={y}
                      x2="740"
                      y2={y}
                      stroke="#252b28"
                      strokeWidth="1"
                      strokeDasharray="3 4"
                    />
                    <text
                      x="54"
                      y={y + 5}
                      fill="#6B7368"
                      fontSize="13"
                      textAnchor="end"
                      fontFamily="ui-monospace, monospace"
                    >
                      {Math.round(value * 100) / 100}
                    </text>
                  </g>
                )
              })}

              {animatedData.length > 0 && (
                <path d={generateAreaPath(animatedData)} fill={`url(#${areaGradId})`} className="transition-opacity duration-500" />
              )}

              {animatedData.length > 0 && (
                <path
                  d={generatePath(animatedData)}
                  fill="none"
                  stroke={`url(#${lineGradId})`}
                  strokeWidth="2.75"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  className="transition-opacity duration-500"
                />
              )}

              {animatedData.length === 1 && (
                <g>
                  <circle
                    cx={pointX(0, 1)}
                    cy={pointY(animatedData[0].value)}
                    r="4"
                    fill={strokeColor}
                    stroke="#0D0F0E"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={pointX(0, 1)}
                    cy={pointY(animatedData[0].value)}
                    r="22"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      setHoveredPoint(0)
                      showPointTip(e, animatedData[0])
                    }}
                  />
                </g>
              )}

              {animatedData.map((point, index) => {
                const x = pointX(index, animatedData.length)
                const y = pointY(point.value)
                const isHovered = hoveredPoint === index

                return (
                  <g key={index}>
                    {isHovered && <circle cx={x} cy={y} r="10" fill={strokeColor} fillOpacity="0.15" />}
                    <circle
                      cx={x}
                      cy={y}
                      r="18"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={(e) => {
                        setHoveredPoint(index)
                        showPointTip(e, point)
                      }}
                    />
                    {isHovered && animatedData.length > 1 && (
                      <circle cx={x} cy={y} r="4" fill={strokeColor} stroke="#0D0F0E" strokeWidth="2" />
                    )}
                    {index % Math.max(1, Math.ceil(animatedData.length / 6)) === 0 && (
                      <text
                        x={x}
                        y={height - 24}
                        fill="#6B7368"
                        fontSize="12"
                        textAnchor="middle"
                        fontFamily="ui-monospace, monospace"
                      >
                        {point.label}
                      </text>
                    )}
                  </g>
                )
              })}

            </svg>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ee-border pt-3 font-mono text-sm text-ee-muted">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-ee-muted">
            <TrendingUp className="size-4 text-ee-muted" strokeWidth={1.75} />
            Span
          </span>
          {animatedData.length > 0 && (
            <>
              <span className="tabular-nums text-ee-text">Min {Math.round(minValue * 100) / 100}</span>
              <span className="tabular-nums text-ee-text">Max {Math.round(maxValue * 100) / 100}</span>
              <span className="tabular-nums text-ee-text">
                Avg {Math.round((animatedData.reduce((s, d) => s + d.value, 0) / animatedData.length) * 100) / 100}
              </span>
            </>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 tabular-nums text-ee-muted">
          <Clock className="size-4" strokeWidth={1.75} />
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}

export default EnhancedLineChart
