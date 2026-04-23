"use client"

import { useState, useContext, useEffect } from "react"
import { DataContext } from "../context/DataContext"
import Camera from "./enhanced-camera"
import DetectionTable from "./enhanced-detection-table"
import { SettingsContext } from "../context/SettingsContext"
import EnhancedBarChart from "./enhanced-bar-chart"
import EnhancedPieChart from "./enhanced-pie-chart"
import EnhancedLineChart from "./enhanced-line-chart"
import { Video, TrendingUp, TriangleAlert, UserRound, Zap, BarChart3, Crosshair } from "lucide-react"

function Main() {
  const { cameraData, updateData } = useContext(DataContext)
  const { selectedTab, setSelectedTab, enableAnnotationsRef } = useContext(SettingsContext)
  const [cameraIds, setCameraIds] = useState([])
  const [annotationsOn, setAnnotationsOn] = useState(() => Boolean(enableAnnotationsRef.current))

  useEffect(() => {
    setCameraIds(Object.keys(cameraData))
  }, [cameraData])

  const activeData = cameraData[selectedTab] || {
    fpsData: [],
    latencyData: [],
    tableData: [],
    personCountData: [],
    category_counts: {},
  }

  const pieChartData = {
    labels: Object.keys(activeData.category_counts || {}),
    datasets: [
      {
        data: Object.values(activeData.category_counts || {}),
        backgroundColor: ["#39FF6A", "#2a8f4a", "#6B7368", "#3d4a42", "#252b28", "#161A18"],
      },
    ],
  }

  const fpsLineChartData = {
    labels: activeData.fpsData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [
      {
        label: "FPS",
        data: activeData.fpsData.map((entry) => entry.fps),
        borderColor: "#39FF6A",
        fill: false,
      },
    ],
  }

  const latencyLineChartData = {
    labels: activeData.latencyData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [
      {
        label: "Latency",
        data: activeData.latencyData.map((entry) => entry.latency),
        borderColor: "#F5A623",
        fill: false,
      },
    ],
  }

  const detectionsLineChartData = {
    labels: activeData.tableData.map((entry) => new Date(entry.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Detections",
        data: activeData.tableData.map((entry) => entry.count),
        borderColor: "#C8D0C8",
        fill: false,
      },
    ],
  }

  const personCountLineChartData = {
    labels: activeData.personCountData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [
      {
        label: "People",
        data: activeData.personCountData.map((entry) => entry.count),
        borderColor: "#67E8F9",
        fill: false,
      },
    ],
  }

  const personCountBarChartData = {
    labels: activeData.personCountData.slice(-6).map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [
      {
        label: "Person count",
        data: activeData.personCountData.slice(-6).map((entry) => entry.count),
      },
    ],
  }

  return (
    <main className="ee-surface flex flex-1 flex-col gap-5 border-t border-ee-border/60 p-3 text-ee-text md:gap-6 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {cameraIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedTab(id)}
              className={`font-display inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                selectedTab === id
                  ? "border-ee-accent bg-ee-inset text-ee-accent shadow-[0_0_14px_rgba(57,255,106,0.12)]"
                  : "border-ee-border bg-ee-base text-ee-muted hover:border-ee-muted hover:text-ee-text"
              }`}
            >
              <Video className="size-3.5 opacity-80" aria-hidden />
              {id}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`font-display inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
            annotationsOn
              ? "border-ee-accent bg-ee-inset text-ee-accent shadow-[0_0_14px_rgba(57,255,106,0.12)]"
              : "border-ee-border bg-ee-base text-ee-muted hover:border-ee-muted hover:text-ee-text"
          }`}
          onClick={() => {
            const next = !enableAnnotationsRef.current
            enableAnnotationsRef.current = next
            setAnnotationsOn(next)
            localStorage.setItem("enableAnnotationsRef", JSON.stringify(next))
          }}
        >
          <Crosshair className={`size-3.5 ${annotationsOn ? "" : "opacity-40"}`} aria-hidden />
          {annotationsOn ? "Overlays ON" : "Overlays OFF"}
        </button>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
        <div className="flex w-full lg:w-1/2">
          <div className="ee-surface-deep flex w-full items-center justify-center rounded-sm border border-ee-border p-3 md:p-4">
            <Camera
              onDataUpdate={(data) => {
                const camId = data.camera_id ?? `camera ${data.index}`
                updateData(camId, data)
              }}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-5 lg:w-1/2">
          <EnhancedPieChart
            data={pieChartData}
            title="Object classes"
            subtitle="Distribution (current stream)"
            icon={<BarChart3 className="size-4" strokeWidth={2} aria-hidden />}
          />
          <EnhancedLineChart
            data={fpsLineChartData}
            title="Frame rate"
            subtitle="Throughput (FPS)"
            icon={<Zap className="size-4" strokeWidth={2} aria-hidden />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <EnhancedLineChart
          data={latencyLineChartData}
          title="Latency"
          subtitle="Round-trip (ms)"
          icon={<TriangleAlert className="size-4" strokeWidth={2} aria-hidden />}
          height={250}
        />

        <EnhancedLineChart
          data={detectionsLineChartData}
          title="Detections"
          subtitle="Events / interval"
          icon={<Video className="size-4" strokeWidth={2} aria-hidden />}
          height={250}
        />

        <EnhancedLineChart
          data={personCountLineChartData}
          title="Personnel"
          subtitle="In-frame count"
          icon={<UserRound className="size-4" strokeWidth={2} aria-hidden />}
          height={250}
        />

        <EnhancedBarChart
          data={personCountBarChartData}
          title="Recent samples"
          subtitle="Last 6 intervals"
          icon={<TrendingUp className="size-4" strokeWidth={2} aria-hidden />}
          height={250}
        />
      </div>

      <div className="ee-surface-deep rounded-sm border border-ee-border">
        <DetectionTable rows={activeData.tableData} />
      </div>
    </main>
  )
}

export default Main
