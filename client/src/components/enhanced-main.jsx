"use client"

import { useState, useContext, useEffect } from "react"
import { DataContext } from "../context/DataContext"
import Camera from "./enhanced-camera"
import DetectionTable from "./enhanced-detection-table"
import { SettingsContext } from "../context/SettingsContext"
import EnhancedBarChart from "./enhanced-bar-chart"
import EnhancedPieChart from "./enhanced-pie-chart"
import EnhancedLineChart from "./enhanced-line-chart"

function Main() {
  const { cameraData, updateData } = useContext(DataContext)
  const { selectedTab, setSelectedTab, enableAnnotationsRef } = useContext(SettingsContext)
  const [cameraIds, setCameraIds] = useState([])

  const CameraIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  )

  const TrendIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )

  const AlertIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )

  const PersonIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  )

  const SpeedIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )

  useEffect(() => {
    console.log("Camera data keys:", Object.keys(cameraData))
    setCameraIds(Object.keys(cameraData))
  }, [cameraData])

  const activeData = cameraData[selectedTab] || {
    fpsData: [],
    latencyData: [],
    tableData: [],
    personCountData: [],
    category_counts: {},
  }

  // Enhanced pie chart data
  const pieChartData = {
    labels: Object.keys(activeData.category_counts || {}),
    datasets: [
      {
        data: Object.values(activeData.category_counts || {}),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
      },
    ],
  }

  // Enhanced line chart data
  const fpsLineChartData = {
    labels: activeData.fpsData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [
      {
        label: "FPS Over Time",
        data: activeData.fpsData.map((entry) => entry.fps),
        borderColor: "#36A2EB",
        fill: false,
      },
    ],
  }

  const latencyLineChartData = {
    labels: activeData.latencyData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [
      {
        label: "Latency Over Time",
        data: activeData.latencyData.map((entry) => entry.latency),
        borderColor: "#FF6384",
        fill: false,
      },
    ],
  }

  const detectionsLineChartData = {
    labels: activeData.tableData.map((entry) => new Date(entry.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Detections Over Time",
        data: activeData.tableData.map((entry) => entry.count),
        borderColor: "#FFCE56",
        fill: false,
      },
    ],
  }

  const personCountLineChartData = {
    labels: activeData.personCountData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [
      {
        label: "Person Count Over Time",
        data: activeData.personCountData.map((entry) => entry.count),
        borderColor: "#4BC0C0",
        fill: false,
      },
    ],
  }

  // Enhanced bar chart data
  const personCountBarChartData = {
    labels: activeData.personCountData.slice(-6).map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [
      {
        label: "Person Count",
        data: activeData.personCountData.slice(-6).map((entry) => entry.count),
      },
    ],
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 transition-all flex flex-col gap-6">
      {/* Enhanced Header Controls */}
      <div className="flex justify-between items-center">
        <div className="flex camera-data-controls space-x-2">
          {cameraIds.map((id) => (
            <button
              key={id}
              onClick={() => setSelectedTab(id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedTab === id
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600"
              }`}
            >
              {id}
            </button>
          ))}
        </div>

        <div>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              enableAnnotationsRef.current
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600"
            }`}
            onClick={() => {
              enableAnnotationsRef.current = !enableAnnotationsRef.current
              localStorage.setItem("enableAnnotationsRef", JSON.stringify(enableAnnotationsRef.current))
            }}
          >
            {enableAnnotationsRef.current ? "🎯 Annotate ON" : "🎯 Annotate OFF"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Camera Feed */}
        <div className="w-full lg:w-1/2 flex">
          <div className="flex items-center justify-center w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-6">
            <Camera
              onDataUpdate={(data) => {
                const camId = data.camera_id ?? `camera ${data.index}`
                console.log("Updating data for camera:", camId, data)
                updateData(camId, data)
              }}
            />
          </div>
        </div>

        {/* Right Side Charts */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="flex-1">
            <EnhancedPieChart
              data={pieChartData}
              title="Detection Categories"
              subtitle="Object detection distribution"
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
            />
          </div>
          <div className="flex-1">
            <EnhancedLineChart
              data={fpsLineChartData}
              title="FPS Performance"
              subtitle="Frame rate monitoring"
              icon={<SpeedIcon />}
            />
          </div>
        </div>
      </div>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <EnhancedLineChart
          data={latencyLineChartData}
          title="Network Latency"
          subtitle="Response time monitoring"
          icon={<AlertIcon />}
          height={250}
        />

        <EnhancedLineChart
          data={detectionsLineChartData}
          title="Detection Events"
          subtitle="Object detection frequency"
          icon={<CameraIcon />}
          height={250}
        />

        <EnhancedLineChart
          data={personCountLineChartData}
          title="Person Tracking"
          subtitle="People count over time"
          icon={<PersonIcon />}
          height={250}
        />

        {/* Enhanced Bar Chart */}
        <EnhancedBarChart
          data={personCountBarChartData}
          title="Recent Activity"
          subtitle="Last 6 measurements"
          icon={<CameraIcon />}
          height={250}
        />
      </div>

      {/* Detection Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
        <DetectionTable rows={activeData.tableData} />
      </div>
    </main>
  )
}

export default Main
