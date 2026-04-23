/**
 * Eagle Eye telemetry metric helpers.
 * Pure functions over the same shapes stored in DataContext (rolling ~60s windows).
 */

function finiteNums(values) {
  return values.map(Number).filter(Number.isFinite)
}

/** Arithmetic mean; empty → null */
export function mean(values) {
  const v = finiteNums(values)
  if (!v.length) return null
  return v.reduce((a, b) => a + b, 0) / v.length
}

/** Ordered sample p-quantile in [0,1]; uses nearest-rank on sorted array */
export function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return null
  const clamped = Math.min(1, Math.max(0, p))
  const idx = Math.min(sortedAsc.length - 1, Math.ceil(clamped * sortedAsc.length) - 1)
  return sortedAsc[idx]
}

export function summarizeNumericSeries(entries, key) {
  const raw = (entries || []).map((e) => e[key])
  const v = finiteNums(raw)
  if (!v.length) {
    return { n: 0, min: null, max: null, avg: null, p95: null, last: null }
  }
  const sorted = [...v].sort((a, b) => a - b)
  return {
    n: v.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: mean(v),
    p95: percentile(sorted, 0.95),
    last: v[v.length - 1],
  }
}

/** Span of a time-keyed series in ms (first → last sample) */
export function seriesSpanMs(entries, timeKey = "time") {
  const t = (entries || []).map((e) => Number(e[timeKey])).filter(Number.isFinite)
  if (t.length < 2) return null
  return Math.max(...t) - Math.min(...t)
}

export function summarizeDetections(tableData) {
  const rows = tableData || []
  const counts = finiteNums(rows.map((r) => r.count))
  if (!counts.length) {
    return { samples: 0, sumObjects: null, avgObjects: null, peakObjects: null, eventsPerMinute: null }
  }
  const sum = counts.reduce((a, b) => a + b, 0)
  const times = rows.map((r) => new Date(r.timestamp).getTime()).filter(Number.isFinite)
  let eventsPerMinute = null
  if (times.length >= 2) {
    const spanMin = (Math.max(...times) - Math.min(...times)) / 60000
    if (spanMin >= 1 / 60) eventsPerMinute = rows.length / spanMin
  }
  return {
    samples: rows.length,
    sumObjects: sum,
    avgObjects: sum / counts.length,
    peakObjects: Math.max(...counts),
    eventsPerMinute,
  }
}

export function summarizeCategoryMix(category_counts) {
  const entries = Object.entries(category_counts || {}).filter(([, n]) => Number(n) > 0)
  if (!entries.length) {
    return { classCount: 0, dominantLabel: null, dominantShare: null, totalTagged: 0 }
  }
  const total = entries.reduce((s, [, v]) => s + Number(v), 0)
  const sorted = entries.sort((a, b) => Number(b[1]) - Number(a[1]))
  const [dominantLabel, dominantVal] = sorted[0]
  return {
    classCount: entries.length,
    dominantLabel,
    dominantShare: total > 0 ? Number(dominantVal) / total : null,
    totalTagged: total,
  }
}

/** One camera’s buffered telemetry */
export function summarizeCameraStream(cam) {
  if (!cam) return null
  const fps = summarizeNumericSeries(cam.fpsData, "fps")
  const latency = summarizeNumericSeries(cam.latencyData, "latency")
  const people = summarizeNumericSeries(cam.personCountData, "count")
  const detections = summarizeDetections(cam.tableData)
  const mix = summarizeCategoryMix(cam.category_counts)
  return {
    fps,
    latency,
    personnel: people,
    detections,
    classMix: mix,
    windowSpanMs: {
      fps: seriesSpanMs(cam.fpsData, "time"),
      latency: seriesSpanMs(cam.latencyData, "time"),
    },
  }
}

/** All cameras: per-id summaries + simple fleet rollups */
export function summarizeFleet(cameraData) {
  const ids = Object.keys(cameraData || {})
  const byId = {}
  for (const id of ids) {
    byId[id] = summarizeCameraStream(cameraData[id])
  }
  let maxPeakObjects = 0
  let maxLatencyP95 = 0
  let minFpsAvg = Infinity
  let totalDetectionSamples = 0
  for (const s of Object.values(byId)) {
    if (!s) continue
    if (s.detections.peakObjects != null) maxPeakObjects = Math.max(maxPeakObjects, s.detections.peakObjects)
    if (s.latency.p95 != null) maxLatencyP95 = Math.max(maxLatencyP95, s.latency.p95)
    if (s.fps.avg != null) minFpsAvg = Math.min(minFpsAvg, s.fps.avg)
    totalDetectionSamples += s.detections.samples
  }
  return {
    cameraCount: ids.length,
    byCamera: byId,
    fleet: {
      totalDetectionSamples,
      maxPeakObjects,
      maxLatencyP95: maxLatencyP95 || null,
      minFpsAvg: Number.isFinite(minFpsAvg) ? minFpsAvg : null,
    },
  }
}

/**
 * Human-readable bullet lines summarizing fleet telemetry.
 * @param {ReturnType<summarizeFleet>} fleetSummary
 * @param {{ productName?: string }} [opts]
 */
export function formatMetricLines(fleetSummary, opts = {}) {
  const name = opts.productName || "Eagle Eye"
  const lines = []
  const { cameraCount, fleet } = fleetSummary || { cameraCount: 0, fleet: {} }
  if (cameraCount > 0) {
    lines.push(
      `${name}: built a multi-stream CCTV analytics UI ingesting ${cameraCount} concurrent camera buffer${cameraCount === 1 ? "" : "s"}.`,
    )
  }
  if (fleet.maxPeakObjects > 0) {
    lines.push(`Peak tracked object load in window: ${fleet.maxPeakObjects} detections in a single logged interval.`)
  }
  if (fleet.maxLatencyP95 != null && fleet.maxLatencyP95 > 0) {
    lines.push(`Observed end-to-end frame latency p95 up to ${Math.round(fleet.maxLatencyP95)} ms (client-measured).`)
  }
  if (fleet.minFpsAvg != null && fleet.minFpsAvg > 0) {
    lines.push(`Sustained decode / UI throughput: average FPS across slowest stream ~${fleet.minFpsAvg.toFixed(1)}.`)
  }
  if (fleet.totalDetectionSamples > 0) {
    lines.push(`Rolling detection log maintained ${fleet.totalDetectionSamples} recent samples for trend charts.`)
  }
  if (lines.length === 0) {
    lines.push(`${name}: real-time object detection dashboard with WebSocket video, charts, and threshold alerts.`)
  }
  return lines
}

/**
 * Compact JSON-safe snapshot for exporting or logging.
 */
export function exportMetricsSnapshot(cameraData) {
  const fleet = summarizeFleet(cameraData)
  return {
    generatedAt: new Date().toISOString(),
    ...fleet,
    summaryLines: formatMetricLines(fleet),
  }
}
