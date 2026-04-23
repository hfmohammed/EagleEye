"use client"

import { useCallback, useContext, useMemo } from "react"
import { DataContext } from "../context/DataContext"
import { SettingsContext } from "../context/SettingsContext"
import {
  X,
  BarChart2,
  Zap,
  Timer,
  ScanEye,
  UserRound,
  Layers,
  Activity,
  Radio,
  FileText,
  Download,
} from "lucide-react"
import { formatMetricLines, summarizeFleet } from "../lib/metrics"

function escapeCsvCell(v) {
  if (v == null) return ""
  const s = String(v)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(rows) {
  const bom = "\uFEFF"
  return bom + rows.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n")
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Flat rows: section, camera_id, key, value, note */
function buildAnalyticsCsvRows(cameraData, selectedTab) {
  const rows = [["section", "camera_id", "key", "value", "note"]]
  const exportedAt = new Date().toISOString()
  rows.push(["meta", "", "exported_at", exportedAt, ""])
  rows.push(["meta", "", "selected_tab", String(selectedTab ?? ""), ""])
  rows.push(["meta", "", "window_note", "Rolling ~60s buffers per stream", ""])

  const active = cameraData?.[selectedTab]
  if (active) {
    const fps = statSeries(active.fpsData, "fps")
    const latency = statSeries(active.latencyData, "latency")
    const detections = statCounts(active.tableData, "count")
    const people = statCounts(active.personCountData, "count")
    const classes = topCategories(active.category_counts, 12)
    const classTotal = classes.reduce((s, c) => s + c.value, 0) || 1
    const rate = detectionRatePerMin(active.tableData)
    const health = healthSummary(fps, latency)

    rows.push(["summary", selectedTab, "health", health, ""])

    const pushNumeric = (prefix, stats, keys) => {
      if (!stats) return
      for (const k of keys) {
        if (k in stats && stats[k] != null && stats[k] !== "") {
          rows.push(["summary", selectedTab, `${prefix}.${k}`, String(stats[k]), ""])
        }
      }
    }
    pushNumeric("fps", fps, ["n", "last", "avg", "min", "max", "p95"])
    pushNumeric("latency_ms", latency, ["n", "last", "avg", "min", "max", "p95"])
    pushNumeric("detections", detections, ["n", "last", "avg", "max", "sum"])
    if (rate) {
      rows.push(["summary", selectedTab, "detections.events_in_window", String(rate.events), ""])
      if (rate.perMin != null) {
        rows.push(["summary", selectedTab, "detections.events_per_min", String(rate.perMin), ""])
      }
    }
    pushNumeric("personnel", people, ["n", "last", "avg", "max"])

    for (const { label, value } of classes) {
      const pct = Math.round((value / classTotal) * 100)
      rows.push(["class_mix", selectedTab, label, String(value), `${pct}%`])
    }
  } else {
    rows.push(["summary", String(selectedTab ?? ""), "health", "No stream data for selected tab", ""])
  }

  for (const [id, cam] of Object.entries(cameraData || {})) {
    const f = statSeries(cam.fpsData, "fps")
    const lat = statSeries(cam.latencyData, "latency")
    const det = statCounts(cam.tableData, "count")
    rows.push([
      "fleet_snapshot",
      id,
      "rollup",
      "",
      [
        `avg_fps:${f?.avg ?? ""}`,
        `avg_latency_ms:${lat?.avg ?? ""}`,
        `events:${det?.n ?? 0}`,
        `peak:${det?.max ?? ""}`,
      ].join(";"),
    ])

    for (const e of cam.fpsData || []) {
      rows.push(["fps_sample", id, String(e.time), String(e.fps), ""])
    }
    for (const e of cam.latencyData || []) {
      rows.push(["latency_sample", id, String(e.time), String(e.latency), ""])
    }
    for (const e of cam.tableData || []) {
      const note = [
        e.camera_id != null && `cam:${e.camera_id}`,
        e.stream_index != null && `idx:${e.stream_index}`,
        e.person_count != null && `people:${e.person_count}`,
        e.class_variety != null && `types:${e.class_variety}`,
        e.dominant_class && `top:${e.dominant_class}`,
        e.fps != null && Number.isFinite(Number(e.fps)) && `fps:${e.fps}`,
        e.latency_ms != null && Number.isFinite(Number(e.latency_ms)) && `lat_ms:${e.latency_ms}`,
        e.avg_confidence != null &&
          Number.isFinite(Number(e.avg_confidence)) &&
          `conf_avg:${Number(e.avg_confidence).toFixed(4)}`,
        e.category_summary && `mix:${e.category_summary}`,
      ]
        .filter(Boolean)
        .join("|")
      rows.push(["detection_sample", id, String(e.timestamp), String(e.count), note])
    }
    for (const e of cam.personCountData || []) {
      rows.push(["person_count_sample", id, String(e.time), String(e.count), ""])
    }
    if (cam.category_counts && typeof cam.category_counts === "object") {
      for (const [label, v] of Object.entries(cam.category_counts)) {
        rows.push(["category_counts_snapshot", id, label, String(v), ""])
      }
    }
  }

  const fleet = summarizeFleet(cameraData)
  formatMetricLines(fleet, { productName: "Eagle Eye" }).forEach((line, i) => {
    rows.push(["metric_line", "", String(i), line, ""])
  })

  return rows
}

function statSeries(entries, key) {
  if (!entries?.length) return null
  const vals = entries.map((e) => Number(e[key])).filter(Number.isFinite)
  if (!vals.length) return null
  const sum = vals.reduce((a, b) => a + b, 0)
  const sorted = [...vals].sort((a, b) => a - b)
  const pick = (p) => sorted[Math.min(Math.max(0, Math.floor((sorted.length - 1) * p)), sorted.length - 1)]
  return {
    n: vals.length,
    last: vals[vals.length - 1],
    avg: sum / vals.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: pick(0.95),
  }
}

function statCounts(entries, key = "count") {
  if (!entries?.length) return null
  const vals = entries.map((e) => Number(e[key])).filter(Number.isFinite)
  if (!vals.length) return null
  const sum = vals.reduce((a, b) => a + b, 0)
  return {
    n: vals.length,
    last: vals[vals.length - 1],
    avg: sum / vals.length,
    max: Math.max(...vals),
    sum,
  }
}

function topCategories(counts, limit = 10) {
  if (!counts || typeof counts !== "object") return []
  return Object.entries(counts)
    .filter(([, v]) => Number(v) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, limit)
    .map(([label, value]) => ({ label, value: Number(value) }))
}

function detectionRatePerMin(tableData) {
  if (!tableData?.length) return null
  const times = tableData.map((r) => new Date(r.timestamp).getTime()).filter(Number.isFinite)
  if (times.length < 2) {
    return { events: tableData.length, perMin: null }
  }
  const spanMs = Math.max(...times) - Math.min(...times)
  const spanMin = spanMs / 60000
  if (spanMin < 1 / 60) return { events: tableData.length, perMin: null }
  return { events: tableData.length, perMin: tableData.length / Math.max(spanMin, 1 / 60) }
}

function healthSummary(fpsStats, latStats) {
  if (!fpsStats?.n && !latStats?.n) return "No telemetry in the last minute yet."
  if (latStats?.p95 > 800) return "Latency p95 is high. Inspect network path or server load."
  if (latStats?.p95 > 400) return "Latency elevated. Watch for frame drops or RTSP jitter."
  if (fpsStats && fpsStats.avg > 0 && fpsStats.avg < 1.5) return "Very low FPS. Reduce resolution, links, or decode settings."
  if (fpsStats && latStats && latStats.avg < 200 && fpsStats.avg >= 3) return "Pipeline responsive with good headroom."
  if (latStats?.avg < 350) return "Within acceptable operating range."
  return "Continue monitoring latency and FPS trends."
}

function formatNum(v, digits = 1) {
  if (v == null || Number.isNaN(v)) return "N/A"
  return Math.round(v * 10 ** digits) / 10 ** digits
}

function StatBlock({ title, icon: Icon, stats, unit = "" }) {
  if (!stats) {
    return (
      <div className="rounded-sm border border-ee-border bg-ee-base/40 p-3">
        <div className="mb-1 flex items-center gap-2 text-ee-muted">
          <Icon className="size-4 shrink-0 text-ee-accent" strokeWidth={1.75} />
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em]">{title}</span>
        </div>
        <p className="font-mono text-xs text-ee-muted">No samples in window</p>
      </div>
    )
  }
  return (
    <div className="rounded-sm border border-ee-border bg-ee-base/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-ee-accent" strokeWidth={1.75} />
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ee-text">{title}</span>
        <span className="ml-auto font-mono text-[10px] text-ee-muted">{stats.n} pts</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-xs text-ee-text">
        <dt className="text-ee-muted">Last</dt>
        <dd className="text-right tabular-nums text-ee-accent">
          {formatNum(stats.last)}
          {unit}
        </dd>
        <dt className="text-ee-muted">Avg</dt>
        <dd className="text-right tabular-nums">{formatNum(stats.avg) + unit}</dd>
        <dt className="text-ee-muted">Min to max</dt>
        <dd className="text-right tabular-nums text-ee-muted">
          {formatNum(stats.min)}
          {unit} to {formatNum(stats.max)}
          {unit}
        </dd>
        {"p95" in stats && (
          <>
            <dt className="text-ee-muted">p95</dt>
            <dd className="text-right tabular-nums text-ee-warning">{formatNum(stats.p95) + unit}</dd>
          </>
        )}
      </dl>
    </div>
  )
}

export default function EnhancedAnalytics() {
  const { cameraData } = useContext(DataContext)
  const { analyticsOpen, setAnalyticsOpen, selectedTab } = useContext(SettingsContext)

  const active = cameraData[selectedTab]

  const selectedAnalytics = useMemo(() => {
    if (!active) return null
    const fps = statSeries(active.fpsData, "fps")
    const latency = statSeries(active.latencyData, "latency")
    const detections = statCounts(active.tableData, "count")
    const people = statCounts(active.personCountData, "count")
    const classes = topCategories(active.category_counts, 12)
    const classTotal = classes.reduce((s, c) => s + c.value, 0) || 1
    const rate = detectionRatePerMin(active.tableData)
    const dominant = classes[0]
    const dominantPct = dominant ? Math.round((dominant.value / classTotal) * 100) : null

    return {
      fps,
      latency,
      detections,
      people,
      classes,
      classTotal,
      rate,
      dominant,
      dominantPct,
      health: healthSummary(fps, latency),
    }
  }, [active])

  const metricLines = useMemo(
    () => formatMetricLines(summarizeFleet(cameraData), { productName: "Eagle Eye" }),
    [cameraData],
  )

  const fleetRows = useMemo(() => {
    return Object.entries(cameraData).map(([id, cam]) => {
      const fps = statSeries(cam.fpsData, "fps")
      const lat = statSeries(cam.latencyData, "latency")
      const det = statCounts(cam.tableData, "count")
      return {
        id,
        fpsAvg: fps?.avg,
        latAvg: lat?.avg,
        events: det?.n ?? 0,
        peak: det?.max,
      }
    })
  }, [cameraData])

  const saveAnalyticsCsv = useCallback(() => {
    const rows = buildAnalyticsCsvRows(cameraData, selectedTab)
    const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")
    downloadTextFile(`eagle-eye-analytics-${stamp}.csv`, toCsv(rows))
  }, [cameraData, selectedTab])

  if (!analyticsOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]"
        onClick={() => setAnalyticsOpen(false)}
        aria-hidden
      />
      <div className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md shadow-2xl">
        <div
          className="ee-surface-deep flex h-full w-full flex-col border-l border-ee-border"
          role="dialog"
          aria-modal="true"
          aria-labelledby="analytics-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-ee-border px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-ee-border bg-ee-base text-ee-accent">
                <BarChart2 className="size-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h2 id="analytics-title" className="font-display text-base font-bold uppercase tracking-[0.14em] text-ee-text">
                  Analytics
                </h2>
                <p className="truncate font-mono text-[11px] text-ee-muted">Rolling ~60s window · {selectedTab}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1.5 rounded-sm border border-ee-border px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ee-text hover:bg-ee-inset"
                onClick={(e) => {
                  e.stopPropagation()
                  saveAnalyticsCsv()
                }}
                aria-label="Save analytics as CSV"
              >
                <Download className="size-4 shrink-0 text-ee-accent" strokeWidth={1.75} />
                CSV
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-sm p-2 text-ee-muted hover:bg-ee-inset hover:text-ee-text"
                onClick={() => setAnalyticsOpen(false)}
                aria-label="Close analytics"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {!active ? (
              <p className="font-mono text-sm text-ee-muted">No stream data yet. Start a feed to populate analytics.</p>
            ) : (
              <div className="space-y-5">
                <div className="rounded-sm border border-ee-accent/25 bg-ee-inset/50 px-3 py-2.5">
                  <p className="flex items-start gap-2 font-mono text-xs leading-relaxed text-ee-text">
                    <Activity className="mt-0.5 size-4 shrink-0 text-ee-accent" strokeWidth={1.75} />
                    {selectedAnalytics?.health}
                  </p>
                </div>

                <div className="grid gap-3">
                  <StatBlock title="Frame rate" icon={Zap} stats={selectedAnalytics?.fps} unit=" fps" />
                  <StatBlock title="Latency" icon={Timer} stats={selectedAnalytics?.latency} unit=" ms" />
                </div>

                <div className="rounded-sm border border-ee-border bg-ee-base/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <ScanEye className="size-4 text-ee-accent" strokeWidth={1.75} />
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ee-text">Detections</span>
                  </div>
                  {selectedAnalytics?.detections ? (
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-xs text-ee-text">
                      <dt className="text-ee-muted">Samples</dt>
                      <dd className="text-right tabular-nums">{selectedAnalytics.detections.n}</dd>
                      <dt className="text-ee-muted">Peak / frame</dt>
                      <dd className="text-right tabular-nums text-ee-warning">{selectedAnalytics.detections.max}</dd>
                      <dt className="text-ee-muted">Avg objects</dt>
                      <dd className="text-right tabular-nums">{formatNum(selectedAnalytics.detections.avg)}</dd>
                      <dt className="text-ee-muted">Σ objects</dt>
                      <dd className="text-right tabular-nums text-ee-muted">{formatNum(selectedAnalytics.detections.sum, 0)}</dd>
                      {selectedAnalytics.rate?.perMin != null && (
                        <>
                          <dt className="text-ee-muted">Events / min</dt>
                          <dd className="text-right tabular-nums text-ee-accent">{formatNum(selectedAnalytics.rate.perMin, 0)}</dd>
                        </>
                      )}
                    </dl>
                  ) : (
                    <p className="font-mono text-xs text-ee-muted">No detection rows in window.</p>
                  )}
                </div>

                <div className="rounded-sm border border-ee-border bg-ee-base/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <UserRound className="size-4 text-ee-accent" strokeWidth={1.75} />
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ee-text">Personnel</span>
                  </div>
                  {selectedAnalytics?.people ? (
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-xs text-ee-text">
                      <dt className="text-ee-muted">Last in frame</dt>
                      <dd className="text-right tabular-nums text-ee-accent">{selectedAnalytics.people.last}</dd>
                      <dt className="text-ee-muted">Avg</dt>
                      <dd className="text-right tabular-nums">{formatNum(selectedAnalytics.people.avg, 2)}</dd>
                      <dt className="text-ee-muted">Max</dt>
                      <dd className="text-right tabular-nums text-ee-warning">{selectedAnalytics.people.max}</dd>
                    </dl>
                  ) : (
                    <p className="font-mono text-xs text-ee-muted">No person-count samples yet.</p>
                  )}
                </div>

                <div className="rounded-sm border border-ee-border bg-ee-base/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Layers className="size-4 text-ee-accent" strokeWidth={1.75} />
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ee-text">Class mix</span>
                  </div>
                  {selectedAnalytics?.classes?.length ? (
                    <ul className="space-y-2">
                      {selectedAnalytics.classes.map(({ label, value }) => {
                        const pct = Math.round((value / selectedAnalytics.classTotal) * 100)
                        return (
                          <li key={label}>
                            <div className="mb-0.5 flex justify-between font-mono text-[11px] text-ee-text">
                              <span className="truncate pr-2">{label}</span>
                              <span className="shrink-0 tabular-nums text-ee-muted">
                                {value} ({pct}%)
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-sm bg-ee-inset">
                              <div
                                className="h-full rounded-sm bg-ee-accent/80"
                                style={{ width: `${Math.max(pct, 1)}%` }}
                              />
                            </div>
                          </li>
                        )
                      })}
                      {selectedAnalytics.dominant && selectedAnalytics.dominantPct != null && (
                        <p className="mt-2 font-mono text-[10px] leading-relaxed text-ee-muted">
                          Dominant: <span className="text-ee-text">{selectedAnalytics.dominant.label}</span> at{" "}
                          {selectedAnalytics.dominantPct}% of last frame aggregate.
                        </p>
                      )}
                    </ul>
                  ) : (
                    <p className="font-mono text-xs text-ee-muted">No class histogram for this stream yet.</p>
                  )}
                </div>

                {fleetRows.length > 1 && (
                  <div className="rounded-sm border border-ee-border bg-ee-base/40 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Radio className="size-4 text-ee-accent" strokeWidth={1.75} />
                      <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ee-text">Fleet snapshot</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[280px] font-mono text-[11px]">
                        <thead>
                          <tr className="border-b border-ee-border text-left text-ee-muted">
                            <th className="py-1.5 pr-2 font-semibold uppercase tracking-wider">Stream</th>
                            <th className="py-1.5 pr-2 text-right">Avg FPS</th>
                            <th className="py-1.5 pr-2 text-right">Avg ms</th>
                            <th className="py-1.5 pr-2 text-right">Events</th>
                            <th className="py-1.5 text-right">Peak</th>
                          </tr>
                        </thead>
                        <tbody className="text-ee-text">
                          {fleetRows.map((row) => (
                            <tr key={row.id} className="border-b border-ee-border/60 last:border-0">
                              <td className={`py-1.5 pr-2 ${row.id === selectedTab ? "text-ee-accent" : ""}`}>{row.id}</td>
                              <td className="py-1.5 pr-2 text-right tabular-nums">{formatNum(row.fpsAvg, 1)}</td>
                              <td className="py-1.5 pr-2 text-right tabular-nums">{formatNum(row.latAvg, 0)}</td>
                              <td className="py-1.5 pr-2 text-right tabular-nums text-ee-muted">{row.events}</td>
                              <td className="py-1.5 text-right tabular-nums text-ee-warning">{row.peak ?? "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 font-mono text-[10px] text-ee-muted">Peak = max objects in one logged interval for that stream.</p>
                  </div>
                )}

                <div className="rounded-sm border border-ee-border bg-ee-base/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="size-4 text-ee-accent" strokeWidth={1.75} />
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ee-text">
                      Metrics
                    </span>
                  </div>
                  <p className="mb-2 font-mono text-[10px] leading-relaxed text-ee-muted">
                    Telemetry snapshot from the current rolling window.
                  </p>
                  <ul className="list-disc space-y-1.5 pl-4 font-mono text-[11px] leading-snug text-ee-text">
                    {metricLines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
