// Updated context/DataContext.jsx to support multiple camera tabs
import React, { createContext, useState } from "react"

export const DataContext = createContext()

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** YOLO / COCO class keys vary; normalize person count for charts */
function personCountFromCategoryCounts(counts) {
  if (!counts || typeof counts !== "object") return 0
  for (const [key, val] of Object.entries(counts)) {
    if (String(key).toLowerCase() === "person") return safeNumber(val, 0)
  }
  return 0
}

function nullableNumber(value) {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function dominantClassFromCounts(counts) {
  if (!counts || typeof counts !== "object") return ""
  let best = ""
  let bestN = -1
  for (const [k, v] of Object.entries(counts)) {
    const n = Number(v)
    if (Number.isFinite(n) && n > bestN) {
      bestN = n
      best = k
    }
  }
  return best
}

function classSummaryCompact(counts, maxLen = 120) {
  if (!counts || typeof counts !== "object") return ""
  const parts = Object.entries(counts)
    .filter(([, v]) => Number(v) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([k, v]) => `${k}:${v}`)
  const s = parts.join(", ")
  if (!s) return ""
  return s.length > maxLen ? `${s.slice(0, Math.max(0, maxLen - 1))}…` : s
}

function avgAnnotationConfidence(annotations) {
  if (!Array.isArray(annotations) || !annotations.length) return null
  const confs = annotations.map((a) => safeNumber(a?.confidence)).filter(Number.isFinite)
  if (!confs.length) return null
  return confs.reduce((a, b) => a + b, 0) / confs.length
}

function newTableRowId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export const DataProvider = ({ children }) => {
  const [cameraData, setCameraData] = useState({})

  const updateData = (cameraId, newData) => {
    const currentTime = Date.now()

    setCameraData((prev) => {
      const prevCam = prev[cameraId] || {
        fpsData: [],
        latencyData: [],
        tableData: [],
        category_counts: {},
        personCountData: [],
      }

      const fps = safeNumber(newData?.fps)
      const latency = safeNumber(newData?.latency)
      const count = safeNumber(newData?.count)
      const persons = personCountFromCategoryCounts(newData?.category_counts)
      const countsObj = newData?.category_counts
      const classVariety =
        countsObj && typeof countsObj === "object"
          ? Object.entries(countsObj).filter(([, v]) => Number(v) > 0).length
          : 0

      return {
        ...prev,
        [cameraId]: {
          fpsData: [...prevCam.fpsData, { time: currentTime, fps }].filter((e) => currentTime - e.time <= 60000),
          latencyData: [...prevCam.latencyData, { time: currentTime, latency }].filter(
            (e) => currentTime - e.time <= 60000,
          ),
          tableData: [
            ...prevCam.tableData,
            {
              row_id: newTableRowId(),
              timestamp: newData.timestamp,
              count,
              fps: nullableNumber(newData?.fps),
              latency_ms: nullableNumber(newData?.latency),
              camera_id: newData?.camera_id != null ? String(newData.camera_id) : String(cameraId),
              stream_index: nullableNumber(newData?.index),
              person_count: persons,
              class_variety: classVariety,
              dominant_class: dominantClassFromCounts(countsObj),
              category_summary: classSummaryCompact(countsObj, 120),
              avg_confidence: avgAnnotationConfidence(newData?.annotations),
            },
          ].filter((e) => currentTime - new Date(e.timestamp).getTime() <= 60000),
          personCountData: [...prevCam.personCountData, { time: currentTime, count: persons }].filter(
            (e) => currentTime - e.time <= 60000,
          ),
          category_counts: newData.category_counts || {},
        },
      }
    })
  }

  return (
    <DataContext.Provider value={{ cameraData, setCameraData, updateData }}>
      {children}
    </DataContext.Provider>
  )
}
