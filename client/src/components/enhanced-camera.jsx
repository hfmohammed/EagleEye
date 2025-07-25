"use client"

import { useState, useEffect, useRef, useCallback, useContext } from "react"
import { SettingsContext } from "../context/SettingsContext"
import { DataContext } from "../context/DataContext"
import { CameraIcon, WifiOff, Activity, Clock, Eye, Settings } from "lucide-react"

const drawAnnotations = (ctx, annotations, scaleX, scaleY) => {
  console.log(ctx, annotations)
  if (!ctx || !annotations) return

  annotations.forEach(({ x1, y1, x2, y2, label, confidence }) => {
    const scaledX1 = x1 * scaleX
    const scaledY1 = y1 * scaleY
    const scaledX2 = x2 * scaleX
    const scaledY2 = y2 * scaleY

    // Modern annotation styling
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 2
    ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1)

    // Label background
    const labelText = `${label} (${confidence.toFixed(2)})`
    ctx.font = "12px Inter, system-ui, sans-serif"
    const textMetrics = ctx.measureText(labelText)
    const labelWidth = textMetrics.width + 8
    const labelHeight = 20

    ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
    ctx.fillRect(scaledX1, scaledY1 - labelHeight, labelWidth, labelHeight)

    // Label text
    ctx.fillStyle = "#ffffff"
    ctx.fillText(labelText, scaledX1 + 4, scaledY1 - 6)
  })
}

const Camera = ({ onDataUpdate }) => {
  const videoRef = useRef(null)
  const canvasOutputRef = useRef({})
  const socket = useRef(null)
  const canvasInputRef = useRef({})
  const mediaStreamRef = useRef(null)
  const FRAME_HEIGHT = 400

  const [isStreaming, setIsStreaming] = useState(false)
  const [objectCount, setObjectCount] = useState([])
  const [annotations, setAnnotations] = useState({})
  const [captureTime, setCaptureTime] = useState(null)
  const [latency, setLatency] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")

  const {
    isCameraEnabled,
    setIsCameraEnabled,
    inFlight,
    switchSource,
    setSwitchSource,
    rtspLinks,
    fps,
    enableAnnotationsRef,
  } = useContext(SettingsContext)
  const { setCameraData } = useContext(DataContext)

  // Status indicator component
  const StatusIndicator = ({ status, label }) => {
    const getStatusColor = () => {
      switch (status) {
        case "connected":
          return "bg-green-400"
        case "connecting":
          return "bg-yellow-400"
        case "disconnected":
          return "bg-red-400"
        default:
          return "bg-gray-400"
      }
    }

    return (
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor()} ${status === "connected" ? "animate-pulse" : ""}`}
        ></div>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
    )
  }

  // Stats card component
  const StatsCard = ({ icon: Icon, label, value, color = "text-white" }) => (
    <div className="bg-slate-700/50 rounded-lg p-3 flex items-center space-x-3">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-sm font-semibold ${color}`}>{value}</p>
      </div>
    </div>
  )

  useEffect(() => {
    let cleanup

    const initializeSocket = async () => {
      if (!isCameraEnabled) {
        setConnectionStatus("connecting")
        console.log(import.meta.env.VITE_WEBSOCKET_URL)
        socket.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_RTSP_URL)

        socket.current.onopen = () => {
          setSwitchSource(false)
          setConnectionStatus("connected")
          console.log("Socket connected to RTSP stream")
        }

        socket.current.onclose = () => {
          setConnectionStatus("disconnected")
          Object.values(canvasOutputRef.current).forEach((canvas) => {
            const ctx = canvas?.getContext("2d")
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
          })
          Object.values(canvasInputRef.current).forEach((canvas) => {
            const ctx = canvas?.getContext("2d")
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
          })
          setSwitchSource(false)
        }

        socket.current.onmessage = (event) => {
          console.log("success")
          inFlight.current = false
          const message = JSON.parse(event.data)
          console.log("RTSP message received:", message)

          const image = new Image()
          image.src = `data:image/jpeg;base64,${message.image}`
          const timestamp = new Date(message.timestamp)
          const currentLatency = Date.now() - timestamp.getTime()
          setLatency(currentLatency)
          message.latency = currentLatency

          image.onload = () => {
            const index = message.index
            const outputCanvas = canvasOutputRef.current[index]
            const ctx = outputCanvas?.getContext("2d")
            if (!ctx || !outputCanvas) return

            const ratio = image.width / image.height
            const width = FRAME_HEIGHT * ratio
            outputCanvas.height = FRAME_HEIGHT
            outputCanvas.width = width

            ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height)
            ctx.drawImage(image, 0, 0, outputCanvas.width, outputCanvas.height)

            const scaleX = outputCanvas.width / image.width
            const scaleY = outputCanvas.height / image.height

            if (enableAnnotationsRef.current) {
              drawAnnotations(ctx, message.annotations, scaleX, scaleY)
            }
          }

          setObjectCount((prev) => {
            const copy = [...prev]
            copy[message.index] = message.count
            return copy
          })

          setAnnotations((prev) => {
            const copy = { ...prev }
            copy[message.index] = message.annotations
            return copy
          })

          console.log("meessssssssage", message)
          onDataUpdate(message)
        }

        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (socket.current?.readyState === WebSocket.OPEN) {
              clearInterval(interval)
              resolve()
            }
          }, 100)
        })

        socket.current.send(
          JSON.stringify({
            action: "BEGIN_STREAM",
            stream_url: `${JSON.stringify(rtspLinks)}`,
            fps: fps,
          }),
        )
        setIsStreaming(true)

        cleanup = () => {
          console.log("Cleaning up rtsp socket connection...")
          setSwitchSource(true)
          setConnectionStatus("disconnected")
          socket.current?.close()
        }
      } else {
        setConnectionStatus("connecting")
        socket.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL)

        socket.current.onopen = () => {
          setConnectionStatus("connected")
          Object.values(canvasOutputRef.current).forEach((canvas) => {
            const ctx = canvas?.getContext("2d")
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
          })
          Object.values(canvasInputRef.current).forEach((canvas) => {
            const ctx = canvas?.getContext("2d")
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
          })
          setSwitchSource(false)
          setIsStreaming(true)
        }

        socket.current.onclose = () => {
          setConnectionStatus("disconnected")
          Object.values(canvasOutputRef.current).forEach((canvas) => {
            const ctx = canvas?.getContext("2d")
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
          })
          Object.values(canvasInputRef.current).forEach((canvas) => {
            const ctx = canvas?.getContext("2d")
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
          })
          setSwitchSource(false)
        }

        socket.current.onmessage = (event) => {
          inFlight.current = false
          const message = JSON.parse(event.data)
          console.log(message)

          const image = new Image()
          image.src = `data:image/jpeg;base64,${message.image}`
          const currentLatency = Date.now() - captureTime
          setLatency(currentLatency)
          message.latency = currentLatency

          image.onload = () => {
            const outputCanvas = canvasOutputRef.current[0]
            const ctx = outputCanvas?.getContext("2d")
            const ratio = image.width / image.height
            const width = FRAME_HEIGHT * ratio
            outputCanvas.height = FRAME_HEIGHT
            outputCanvas.width = width

            ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height)
            ctx.drawImage(image, 0, 0, outputCanvas.width, outputCanvas.height)

            const scaleX = outputCanvas.width / image.width
            const scaleY = outputCanvas.height / image.height

            if (enableAnnotationsRef.current) {
              drawAnnotations(ctx, message.annotations, scaleX, scaleY)
            }
          }

          setObjectCount([message.count])
          setAnnotations([message.annotations])
          console.log("meessssssssage", message)
          onDataUpdate(message)
        }

        cleanup = () => {
          console.log("Cleaning up webcam socket connection...")
          setSwitchSource(true)
          setConnectionStatus("disconnected")
          socket.current?.close()
          setIsStreaming(false)
        }
      }
    }

    setCameraData({})
    initializeSocket()

    return () => {
      if (cleanup) cleanup()
    }
  }, [isCameraEnabled, rtspLinks])

  const emitFrameToServer = useCallback(() => {
    if (inFlight.current) return
    const video = videoRef.current
    if (video && video.srcObject) {
      inFlight.current = true
      const stream = video.srcObject
      const videoTrack = stream.getVideoTracks()[0]
      setCaptureTime(Date.now())
      console.log("captured on", captureTime)

      const imageCapture = new ImageCapture(videoTrack)
      imageCapture
        .grabFrame()
        .then((imageBitmap) => {
          imageToBlob(imageBitmap).then((blob) => {
            if (socket.current.readyState === WebSocket.OPEN) {
              socket.current.send(blob)
            }
          })
        })
        .catch((error) => {
          console.error("Error capturing frame:", error)
        })
    }
  }, [])

  useEffect(() => {
    if (!isCameraEnabled) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
      }
      return
    } else {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          mediaStreamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((error) => {
          console.error("Error accessing media devices.", error)
          setIsCameraEnabled(false)
        })
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
      }
    }
  }, [isCameraEnabled])

  const imageToBlob = (image) => {
    return new Promise((resolve) => {
      const inputCanvas = canvasInputRef.current[0]
      const contextCvsInp = inputCanvas.getContext("2d")
      inputCanvas.height = image.height
      inputCanvas.width = image.width
      contextCvsInp.clearRect(0, 0, image.width, image.height)
      contextCvsInp.drawImage(image, 0, 0, image.width, image.height)
      contextCvsInp.canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        "image/jpeg",
        0.99,
      )
    })
  }

  useEffect(() => {
    console.log("aaaa")
    if (!isCameraEnabled) return
    console.log("bbbb")
    const interval = setInterval(emitFrameToServer, 1000 / fps)
    return () => clearInterval(interval)
  }, [emitFrameToServer, isCameraEnabled, fps])

  // Render camera feeds
  const renderCameraFeed = (index, rtspLink) => (
    <div key={index} className="bg-slate-700/30 rounded-xl border border-slate-600 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <CameraIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Camera {index + 1}</h3>
              <p className="text-xs text-slate-400">RTSP Stream</p>
            </div>
          </div>
          <StatusIndicator
            status={isStreaming && !switchSource ? "connected" : "disconnected"}
            label={isStreaming && !switchSource ? "Live" : "Offline"}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatsCard icon={Settings} label="FPS" value={fps} color="text-blue-400" />
          <StatsCard icon={Eye} label="Objects" value={objectCount[index] || 0} color="text-green-400" />
          <StatsCard
            icon={Clock}
            label="Latency"
            value={`${latency}ms`}
            color={latency > 100 ? "text-red-400" : "text-green-400"}
          />
        </div>
      </div>

      {/* Video Feed */}
      <div className="p-4">
        {!switchSource ? (
          <div className="relative bg-slate-800 rounded-lg overflow-hidden">
            <canvas
              ref={(el) => (canvasOutputRef.current[index] = el)}
              className="w-full h-auto rounded-lg"
              style={{ maxHeight: "400px" }}
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
                <div className="text-center">
                  <WifiOff className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400">No Signal</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Connecting...</p>
          </div>
        )}
      </div>
    </div>
  )

  // Render webcam feed
  const renderWebcamFeed = () => (
    <div className="bg-slate-700/30 rounded-xl border border-slate-600 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <CameraIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Webcam</h3>
              <p className="text-xs text-slate-400">Local Camera</p>
            </div>
          </div>
          <StatusIndicator
            status={isStreaming && !switchSource ? "connected" : "disconnected"}
            label={isStreaming && !switchSource ? "Live" : "Offline"}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatsCard icon={Settings} label="FPS" value={fps} color="text-blue-400" />
          <StatsCard icon={Eye} label="Objects" value={objectCount[0] || 0} color="text-green-400" />
          <StatsCard icon={Activity} label="Status" value={connectionStatus} color="text-cyan-400" />
        </div>
      </div>

      {/* Video Feed */}
      <div className="p-4">
        {!switchSource ? (
          <div className="relative bg-slate-800 rounded-lg overflow-hidden">
            <canvas
              ref={(el) => (canvasOutputRef.current[0] = el)}
              className="w-full h-auto rounded-lg"
              style={{ maxHeight: "400px" }}
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
                <div className="text-center">
                  <WifiOff className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400">Camera Offline</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Connecting to camera...</p>
          </div>
        )}
      </div>

      {/* Hidden elements for functionality */}
      <div className="hidden">
        <video ref={videoRef} autoPlay />
        <canvas ref={(el) => (canvasInputRef.current[0] = el)} />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {console.log(rtspLinks)}

      {/* RTSP Cameras */}
      {!isCameraEnabled && rtspLinks && rtspLinks.length > 0 && (
        <div className={`grid gap-6 ${rtspLinks.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
          {rtspLinks.map((rtspLink, index) => renderCameraFeed(index, rtspLink))}
        </div>
      )}

      {/* Webcam */}
      {isCameraEnabled && renderWebcamFeed()}

      {/* Hidden canvases for other cameras */}
      <div className="hidden">
        {rtspLinks &&
          rtspLinks.map((_, index) => (
            <canvas key={`input-${index}`} ref={(el) => (canvasInputRef.current[index] = el)} />
          ))}
      </div>
    </div>
  )
}

export default Camera
