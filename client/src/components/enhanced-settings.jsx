"use client"

import { useContext, useState, useEffect, useRef } from "react"
import { SettingsContext } from "../context/SettingsContext"
import { X, SettingsIcon, Camera, Wifi, Plus, Trash2, Save, AlertCircle, Monitor, Radio, Sliders } from "lucide-react"

const Settings = () => {
  const {
    isCameraEnabled,
    setIsCameraEnabled,
    toggleCamera,
    inflight,
    switchSource,
    fps,
    setFps,
    rtspLinks,
    setRtspLinks,
    inputSource,
    setInputSource,
    saveSettings,
    settingsOpen,
    setSettingsOpen,
  } = useContext(SettingsContext)

  const [editedFps, setEditedFps] = useState(fps)
  const [editedRtspLinks, setEditedRtspLinks] = useState(rtspLinks)
  const [selectedSource, setSelectedSource] = useState(inputSource)
  const [errors, setErrors] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const bottomRef = useRef(null)

  // Update local state when context values change
  useEffect(() => {
    console.log(rtspLinks)
    setSelectedSource(inputSource)
    setEditedFps(fps)
    setEditedRtspLinks(rtspLinks)
  }, [inputSource, fps, rtspLinks, settingsOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    console.log(editedRtspLinks)
  }, [editedRtspLinks])

  const handleSourceChange = (event) => {
    const newSource = event.target.value
    console.log("Source changed to:", newSource)
    setSelectedSource(newSource)
  }

  const _saveSettings = async () => {
    setIsSaving(true)

    if (selectedSource === "webcam") {
      // Clear RTSP link if webcam is selected
    }

    console.log("Saving settings:", { editedFps, editedRtspLinks, selectedSource })
    const newErrors = await saveSettings(editedFps, editedRtspLinks, selectedSource)
    console.log("NEW ERRORS", newErrors)

    if (newErrors.length > 0) {
      setErrors(newErrors)
      console.log(newErrors)
    } else {
      setErrors([])
      console.log("success")
      setSettingsOpen(false)
    }

    setIsSaving(false)
  }

  const addRtspLink = () => {
    console.log(editedRtspLinks)
    console.log("clicked add item")
    setEditedRtspLinks([...editedRtspLinks, ""])
    console.log(editedRtspLinks)
  }

  const removeRtspLink = (index) => {
    setEditedRtspLinks(editedRtspLinks.filter((_, i) => i !== index))
  }

  const updateRtspLink = (index, value) => {
    const updatedRtspLinks = [...editedRtspLinks]
    updatedRtspLinks[index] = value
    setEditedRtspLinks(updatedRtspLinks)
  }

  if (!settingsOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={() => setSettingsOpen(false)}
      />

      {/* Settings Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Settings</h1>
                  <p className="text-sm text-slate-400">Configure your CCTV system</p>
                </div>
              </div>

              <button
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                onClick={() => setSettingsOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20">
              {errors.map((error, index) => (
                <div key={index} className="flex items-center space-x-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-8">
              {/* FPS Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Frame Rate</h3>
                    <p className="text-sm text-slate-400">Adjust video capture frame rate</p>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="range"
                        min={1}
                        max={40}
                        step={1}
                        value={editedFps}
                        onChange={(e) => setEditedFps(Number(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>1 FPS</span>
                        <span>40 FPS</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={1}
                        max={40}
                        step={1}
                        value={editedFps}
                        onChange={(e) => setEditedFps(Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-slate-600 border border-slate-500 rounded-lg text-white text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                      <span className="text-sm text-slate-300 font-medium">FPS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Source */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Input Source</h3>
                    <p className="text-sm text-slate-400">Choose your video input method</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Webcam Option */}
                  <label
                    className={`relative cursor-pointer ${selectedSource === "webcam" ? "ring-2 ring-green-500" : ""}`}
                  >
                    <input
                      type="radio"
                      name="input-source"
                      value="webcam"
                      checked={selectedSource === "webcam"}
                      onChange={handleSourceChange}
                      className="sr-only"
                    />
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        selectedSource === "webcam"
                          ? "bg-green-500/20 border-green-500 text-green-400"
                          : "bg-slate-700/30 border-slate-600 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Monitor className="w-5 h-5" />
                        <div>
                          <div className="font-medium">Webcam</div>
                          <div className="text-xs opacity-75">Use local camera</div>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* RTSP Option */}
                  <label
                    className={`relative cursor-pointer ${selectedSource === "rtsp" ? "ring-2 ring-blue-500" : ""}`}
                  >
                    <input
                      type="radio"
                      name="input-source"
                      value="rtsp"
                      checked={selectedSource === "rtsp"}
                      onChange={handleSourceChange}
                      className="sr-only"
                    />
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        selectedSource === "rtsp"
                          ? "bg-blue-500/20 border-blue-500 text-blue-400"
                          : "bg-slate-700/30 border-slate-600 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Radio className="w-5 h-5" />
                        <div>
                          <div className="font-medium">RTSP Stream</div>
                          <div className="text-xs opacity-75">Network cameras</div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* RTSP Links */}
              {selectedSource === "rtsp" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Wifi className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">RTSP Streams</h3>
                        <p className="text-sm text-slate-400">Configure your camera streams</p>
                      </div>
                    </div>

                    <button
                      onClick={addRtspLink}
                      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Stream</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {editedRtspLinks.map((link, index) => (
                      <div key={index} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Camera {index + 1} RTSP URL
                            </label>
                            <input
                              type="text"
                              placeholder="rtsp://username:password@ip:port/stream"
                              value={link}
                              onChange={(e) => updateRtspLink(index, e.target.value)}
                              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                            />
                          </div>

                          <button
                            onClick={() => removeRtspLink(index)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef}></div>
                  </div>

                  {editedRtspLinks.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No RTSP streams configured</p>
                      <p className="text-sm">Click "Add Stream" to get started</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={_saveSettings}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes zoom-in {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }

        .animate-in {
          animation: fade-in 0.3s ease-out, zoom-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default Settings
