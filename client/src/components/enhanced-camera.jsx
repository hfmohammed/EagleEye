"use client"

import { useState, useEffect, useRef, useCallback, useContext, useMemo } from "react"
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

    ctx.strokeStyle = "#39FF6A"
    ctx.lineWidth = 1.5
    ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1)

    const labelText = `${label} ${(confidence * 100).toFixed(0)}%`
    ctx.font = "11px ui-monospace, monospace"
    const textMetrics = ctx.measureText(labelText)
    const labelWidth = textMetrics.width + 10
    const labelHeight = 18

    ctx.fillStyle = "rgba(17, 21, 16, 0.94)"
    ctx.fillRect(scaledX1, scaledY1 - labelHeight, labelWidth, labelHeight)
    ctx.strokeStyle = "#39FF6A"
    ctx.lineWidth = 1
    ctx.strokeRect(scaledX1, scaledY1 - labelHeight, labelWidth, labelHeight)

    ctx.fillStyle = "#E8EAE8"
    ctx.fillText(labelText, scaledX1 + 5, scaledY1 - 5)
  })
}

const Camera = ({ onDataUpdate }) => {
  const videoRef = useRef(null)
  const canvasOutputRef = useRef({})
  const socket = useRef(null)
  const canvasInputRef = useRef({})
  const mediaStreamRef = useRef(null)
  const captureTimeRef = useRef(0)

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

  const rtspCount = !isCameraEnabled && rtspLinks?.length ? rtspLinks.length : 0
  const frameHeight = useMemo(() => {
    if (isCameraEnabled) return 400
    if (rtspCount >= 3) return 220
    if (rtspCount === 2) return 260
    return 400
  }, [isCameraEnabled, rtspCount])

  // Status indicator component
  const StatusIndicator = ({ status, label }) => {
    const getStatusColor = () => {
      switch (status) {
        case "connected":
          return "bg-ee-accent shadow-[0_0_10px_rgba(57,255,106,0.45)]"
        case "connecting":
          return "bg-ee-warning"
        case "disconnected":
          return "bg-ee-critical"
        default:
          return "bg-ee-muted"
      }
    }

    return (
      <div className="flex items-center gap-2">
        <div
          className={`size-2 shrink-0 rounded-sm ${getStatusColor()} ${status === "connected" ? "animate-pulse" : ""}`}
        />
        <span className="font-mono text-[10px] uppercase tracking-wider text-ee-muted">{label}</span>
      </div>
    )
  }

  // Stats card component
  const StatsCard = ({ icon: Icon, label, value, color = "text-ee-text" }) => (
    <div className="flex items-center gap-2 rounded-sm border border-ee-border bg-ee-base/50 p-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-ee-border bg-ee-inset text-ee-accent">
        <Icon className="size-3.5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-ee-muted">{label}</p>
        <p className={`truncate font-mono text-xs font-semibold tabular-nums ${color}`}>{value}</p>
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
            const width = frameHeight * ratio
            outputCanvas.height = frameHeight
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
          const currentLatency = Math.max(0, Date.now() - captureTimeRef.current)
          setLatency(currentLatency)
          message.latency = currentLatency

          image.onload = () => {
            const outputCanvas = canvasOutputRef.current[0]
            const ctx = outputCanvas?.getContext("2d")
            const ratio = image.width / image.height
            const width = frameHeight * ratio
            outputCanvas.height = frameHeight
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
      captureTimeRef.current = Date.now()
      setCaptureTime(captureTimeRef.current)

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
    <div
      key={index}
      className="ee-surface-deep relative overflow-hidden rounded-sm border border-ee-border"
    >
      <div className="border-b border-ee-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-sm border border-ee-border bg-ee-base text-ee-accent">
              <CameraIcon className="size-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-ee-text">Camera {index + 1}</h3>
              <p className="font-mono text-[10px] text-ee-muted">RTSP ingress</p>
            </div>
          </div>
          <StatusIndicator
            status={isStreaming && !switchSource ? "connected" : "disconnected"}
            label={isStreaming && !switchSource ? "Live" : "Offline"}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatsCard icon={Settings} label="FPS" value={fps} color="text-ee-text" />
          <StatsCard icon={Eye} label="Objects" value={objectCount[index] || 0} color="text-ee-text" />
          <StatsCard
            icon={Clock}
            label="Latency"
            value={`${latency}ms`}
            color={latency > 100 ? "text-ee-warning" : "text-ee-accent"}
          />
        </div>
      </div>

      <div className="p-4">
        {!switchSource ? (
          <div className="relative overflow-hidden rounded-sm border border-ee-border bg-ee-base">
            <canvas
              ref={(el) => (canvasOutputRef.current[index] = el)}
              className="h-auto w-full rounded-sm"
              style={{ maxHeight: `${frameHeight}px` }}
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-ee-base/85">
                <div className="text-center">
                  <WifiOff className="mx-auto mb-2 size-10 text-ee-muted" strokeWidth={1.5} />
                  <p className="font-mono text-xs text-ee-muted">No signal</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-sm border border-ee-border bg-ee-base p-8 text-center">
            <div className="mx-auto mb-3 size-7 animate-spin rounded-sm border-2 border-ee-border border-t-ee-accent" />
            <p className="font-mono text-xs text-ee-muted">Handshaking stream…</p>
          </div>
        )}
      </div>
    </div>
  )

  // Render webcam feed
  const renderWebcamFeed = () => (
    <div className="ee-surface-deep overflow-hidden rounded-sm border border-ee-border">
      <div className="border-b border-ee-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-sm border border-ee-border bg-ee-base text-ee-accent">
              <CameraIcon className="size-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-ee-text">Webcam</h3>
              <p className="font-mono text-[10px] text-ee-muted">Local sensor</p>
            </div>
          </div>
          <StatusIndicator
            status={isStreaming && !switchSource ? "connected" : "disconnected"}
            label={isStreaming && !switchSource ? "Live" : "Offline"}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatsCard icon={Settings} label="FPS" value={fps} color="text-ee-text" />
          <StatsCard icon={Eye} label="Objects" value={objectCount[0] || 0} color="text-ee-text" />
          <StatsCard icon={Activity} label="Status" value={connectionStatus} color="text-ee-text" />
        </div>
      </div>

      <div className="p-4">
        {!switchSource ? (
          <div className="relative overflow-hidden rounded-sm border border-ee-border bg-ee-base">
            <canvas
              ref={(el) => (canvasOutputRef.current[0] = el)}
              className="h-auto w-full rounded-sm"
              style={{ maxHeight: `${frameHeight}px` }}
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-ee-base/85">
                <div className="text-center">
                  <WifiOff className="mx-auto mb-2 size-10 text-ee-muted" strokeWidth={1.5} />
                  <p className="font-mono text-xs text-ee-muted">Sensor offline</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-sm border border-ee-border bg-ee-base p-8 text-center">
            <div className="mx-auto mb-3 size-7 animate-spin rounded-sm border-2 border-ee-border border-t-ee-accent" />
            <p className="font-mono text-xs text-ee-muted">Handshaking stream…</p>
          </div>
        )}
      </div>

      <div className="hidden">
        <video ref={videoRef} autoPlay />
        <canvas ref={(el) => (canvasInputRef.current[0] = el)} />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* RTSP Cameras */}
      {!isCameraEnabled && rtspLinks && rtspLinks.length > 0 && (
        <div
          className={`grid gap-6 ${
            rtspLinks.length <= 2 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
          }`}
        >
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
