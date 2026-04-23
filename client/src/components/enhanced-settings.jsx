"use client"

import { useContext, useState, useEffect, useRef } from "react"
import { SettingsContext } from "../context/SettingsContext"
import {
  X,
  Settings as SettingsIcon,
  Camera,
  Wifi,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Monitor,
  Radio,
  SlidersHorizontal,
  Loader2,
} from "lucide-react"

const Settings = () => {
  const {
    fps,
    rtspLinks,
    inputSource,
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

  useEffect(() => {
    setSelectedSource(inputSource)
    setEditedFps(fps)
    setEditedRtspLinks(rtspLinks)
  }, [inputSource, fps, rtspLinks, settingsOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [editedRtspLinks])

  const handleSourceChange = (event) => {
    setSelectedSource(event.target.value)
  }

  const _saveSettings = async () => {
    setIsSaving(true)
    const newErrors = await saveSettings(editedFps, editedRtspLinks, selectedSource)
    if (newErrors.length > 0) {
      setErrors(newErrors)
    } else {
      setErrors([])
      setSettingsOpen(false)
    }
    setIsSaving(false)
  }

  const addRtspLink = () => {
    setEditedRtspLinks([...editedRtspLinks, ""])
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
      <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px]" onClick={() => setSettingsOpen(false)} aria-hidden />

      <div
        className="fixed inset-0 z-[61] flex items-center justify-center p-4"
        onClick={() => setSettingsOpen(false)}
        role="presentation"
      >
        <div
          className="ee-surface-deep flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-sm border border-ee-border shadow-2xl ring-1 ring-ee-border/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-ee-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-ee-border bg-ee-base text-ee-accent">
                <SettingsIcon className="size-5" strokeWidth={1.75} />
              </div>
              <div>
                <h2 id="settings-title" className="font-display text-base font-bold uppercase tracking-[0.16em] text-ee-text">
                  Configuration
                </h2>
                <p className="font-mono text-[11px] text-ee-muted">Ingress, sensors, decode load</p>
              </div>
            </div>
            <button
              type="button"
              className="cursor-pointer rounded-sm p-2 text-ee-muted transition-colors hover:bg-ee-inset hover:text-ee-text"
              onClick={() => setSettingsOpen(false)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          {errors.length > 0 && (
            <div className="border-b border-ee-critical/40 bg-ee-critical/10 px-5 py-3">
              {errors.map((error, index) => (
                <div key={index} className="flex gap-2 font-mono text-sm text-ee-critical">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-8">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-ee-text">
                  <SlidersHorizontal className="size-4 text-ee-muted" strokeWidth={1.75} />
                  <h3 className="font-display text-xs font-bold uppercase tracking-[0.14em]">Frame rate</h3>
                </div>
                <div className="rounded-sm border border-ee-border bg-ee-base/50 p-4">
                  <input
                    type="range"
                    min={1}
                    max={40}
                    step={1}
                    value={editedFps}
                    onChange={(e) => setEditedFps(Number(e.target.value))}
                    className="ee-range w-full"
                  />
                  <div className="mt-2 flex items-center justify-between font-mono text-xs text-ee-muted">
                    <span>1</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={40}
                        value={editedFps}
                        onChange={(e) => setEditedFps(Number(e.target.value))}
                        className="w-14 rounded-sm border border-ee-border bg-ee-elevate py-1 text-center font-mono text-sm text-ee-text focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
                      />
                      <span className="text-ee-muted">fps</span>
                    </div>
                    <span>40</span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-ee-text">
                  <Camera className="size-4 text-ee-muted" strokeWidth={1.75} />
                  <h3 className="font-display text-xs font-bold uppercase tracking-[0.14em]">Input source</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block cursor-pointer">
                    <input
                      type="radio"
                      name="input-source"
                      value="webcam"
                      checked={selectedSource === "webcam"}
                      onChange={handleSourceChange}
                      className="sr-only"
                    />
                    <div
                      className={`rounded-sm border p-4 transition-colors ${
                        selectedSource === "webcam"
                          ? "border-ee-accent bg-ee-elevate/80 ring-1 ring-ee-accent/30"
                          : "border-ee-border bg-ee-base/40 hover:border-ee-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-sm">
                        <Monitor className="size-5 text-ee-accent" strokeWidth={1.75} />
                        <div>
                          <p className="font-display text-xs font-bold uppercase tracking-wide text-ee-text">Webcam</p>
                          <p className="font-mono text-[10px] text-ee-muted">Local sensor</p>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="block cursor-pointer">
                    <input
                      type="radio"
                      name="input-source"
                      value="rtsp"
                      checked={selectedSource === "rtsp"}
                      onChange={handleSourceChange}
                      className="sr-only"
                    />
                    <div
                      className={`rounded-sm border p-4 transition-colors ${
                        selectedSource === "rtsp"
                          ? "border-ee-accent bg-ee-elevate/80 ring-1 ring-ee-accent/30"
                          : "border-ee-border bg-ee-base/40 hover:border-ee-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-sm">
                        <Radio className="size-5 text-ee-accent" strokeWidth={1.75} />
                        <div>
                          <p className="font-display text-xs font-bold uppercase tracking-wide text-ee-text">RTSP</p>
                          <p className="font-mono text-[10px] text-ee-muted">Network ingress</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </section>

              {selectedSource === "rtsp" && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-ee-text">
                      <Wifi className="size-4 text-ee-muted" strokeWidth={1.75} />
                      <h3 className="font-display text-xs font-bold uppercase tracking-[0.14em]">Streams</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addRtspLink}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-ee-border bg-ee-inset px-2.5 py-1.5 font-mono text-xs font-medium text-ee-text hover:bg-ee-inset/90"
                    >
                      <Plus className="size-3.5" />
                      Add URL
                    </button>
                  </div>

                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {editedRtspLinks.map((link, index) => (
                      <div key={index} className="flex gap-2 rounded-sm border border-ee-border bg-ee-base/50 p-3">
                        <div className="min-w-0 flex-1">
                          <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-ee-muted">
                            Camera {index + 1}
                          </label>
                          <input
                            type="text"
                            placeholder="rtsp://username:password@host:554/stream"
                            value={link}
                            onChange={(e) => updateRtspLink(index, e.target.value)}
                            className="w-full rounded-sm border border-ee-border bg-ee-elevate px-2.5 py-2 font-mono text-sm text-ee-text placeholder:text-ee-muted focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
                            />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRtspLink(index)}
                          className="mt-5 shrink-0 cursor-pointer self-start rounded-sm border border-transparent p-2 text-ee-muted hover:border-ee-critical/30 hover:bg-ee-critical/10 hover:text-ee-critical"
                          aria-label="Remove stream"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  {editedRtspLinks.length === 0 && (
                    <div className="rounded-sm border border-dashed border-ee-border py-8 text-center font-mono text-sm text-ee-muted">
                      <Camera className="mx-auto mb-2 size-10 opacity-40" strokeWidth={1.25} />
                      <p>No RTSP URLs yet.</p>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-ee-border bg-ee-base/50 px-5 py-4">
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="cursor-pointer rounded-sm px-4 py-2 font-mono text-sm font-medium text-ee-muted hover:bg-ee-inset hover:text-ee-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={_saveSettings}
              disabled={isSaving}
              className="font-display inline-flex cursor-pointer items-center gap-2 rounded-sm bg-ee-accent px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ee-cta-ink shadow-[0_0_20px_rgba(57,255,106,0.22)] hover:brightness-110 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Settings
