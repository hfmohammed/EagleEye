"use client"

import { useContext, useEffect, useMemo, useState } from "react"
import { SettingsContext } from "../context/SettingsContext"
import { DataContext } from "../context/DataContext"
import { X, Bell, Save, TriangleAlert } from "lucide-react"
import { collectAllStreamAlerts, defaultNotificationPrefs } from "../lib/streamAlerts"

function NumField({ id, label, value, onChange, suffix }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ee-muted">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          id={id}
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            onChange(Number.isFinite(n) ? n : 0)
          }}
          className="w-full min-w-0 rounded-sm border border-ee-border bg-ee-base px-2 py-1.5 font-mono text-sm text-ee-text focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
        />
        {suffix && <span className="shrink-0 font-mono text-[10px] text-ee-muted">{suffix}</span>}
      </div>
    </div>
  )
}

export default function EnhancedNotifications() {
  const { notificationsOpen, setNotificationsOpen, notificationPrefs, setNotificationPrefs } = useContext(SettingsContext)
  const { cameraData } = useContext(DataContext)
  const [draft, setDraft] = useState(defaultNotificationPrefs)

  useEffect(() => {
    if (!notificationsOpen) return
    setDraft({ ...defaultNotificationPrefs, ...notificationPrefs })
  }, [notificationsOpen, notificationPrefs])

  const liveAlerts = useMemo(() => collectAllStreamAlerts(cameraData, draft), [cameraData, draft])

  if (!notificationsOpen) return null

  const save = () => {
    setNotificationPrefs(draft)
    setNotificationsOpen(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]" onClick={() => setNotificationsOpen(false)} aria-hidden />
      <div className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md shadow-2xl">
        <div
          className="ee-surface-deep flex h-full w-full flex-col border-l border-ee-border"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-ee-border px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-ee-border bg-ee-base text-ee-accent">
                <Bell className="size-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h2 id="notif-title" className="font-display text-base font-bold uppercase tracking-[0.14em] text-ee-text">
                  Notifications
                </h2>
                <p className="font-mono text-[11px] text-ee-muted">Thresholds · all streams</p>
              </div>
            </div>
            <button
              type="button"
              className="cursor-pointer rounded-sm p-2 text-ee-muted hover:bg-ee-inset hover:text-ee-text"
              onClick={() => setNotificationsOpen(false)}
              aria-label="Close notifications"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
            <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-ee-border bg-ee-base/40 px-3 py-2.5">
              <input
                type="checkbox"
                checked={draft.alertsEnabled}
                onChange={(e) => setDraft((d) => ({ ...d, alertsEnabled: e.target.checked }))}
                className="size-3.5 rounded-sm border-ee-border"
              />
              <span className="font-mono text-sm text-ee-text">Enable threshold alerts</span>
            </label>

            <div className="rounded-sm border border-ee-border bg-ee-base/30 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ee-text">Latency</span>
                <input
                  type="checkbox"
                  checked={draft.latencyEnabled}
                  onChange={(e) => setDraft((d) => ({ ...d, latencyEnabled: e.target.checked }))}
                  className="size-3.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  id="lat-warn"
                  label="Warn ≥"
                  value={draft.latencyWarnMs}
                  onChange={(v) => setDraft((d) => ({ ...d, latencyWarnMs: v }))}
                  suffix="ms"
                />
                <NumField
                  id="lat-crit"
                  label="Critical ≥"
                  value={draft.latencyCriticalMs}
                  onChange={(v) => setDraft((d) => ({ ...d, latencyCriticalMs: v }))}
                  suffix="ms"
                />
              </div>
            </div>

            <div className="rounded-sm border border-ee-border bg-ee-base/30 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ee-text">Objects / frame</span>
                <input
                  type="checkbox"
                  checked={draft.objectsEnabled}
                  onChange={(e) => setDraft((d) => ({ ...d, objectsEnabled: e.target.checked }))}
                  className="size-3.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  id="obj-warn"
                  label="Warn ≥"
                  value={draft.objectsWarn}
                  onChange={(v) => setDraft((d) => ({ ...d, objectsWarn: v }))}
                />
                <NumField
                  id="obj-crit"
                  label="Critical ≥"
                  value={draft.objectsCritical}
                  onChange={(v) => setDraft((d) => ({ ...d, objectsCritical: v }))}
                />
              </div>
            </div>

            <div className="rounded-sm border border-ee-border bg-ee-base/30 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ee-text">People in frame</span>
                <input
                  type="checkbox"
                  checked={draft.personsEnabled}
                  onChange={(e) => setDraft((d) => ({ ...d, personsEnabled: e.target.checked }))}
                  className="size-3.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  id="per-warn"
                  label="Warn ≥"
                  value={draft.personsWarn}
                  onChange={(v) => setDraft((d) => ({ ...d, personsWarn: v }))}
                />
                <NumField
                  id="per-crit"
                  label="Critical ≥"
                  value={draft.personsCritical}
                  onChange={(v) => setDraft((d) => ({ ...d, personsCritical: v }))}
                />
              </div>
            </div>

            <div className="rounded-sm border border-ee-warning/30 bg-ee-warning/5 p-3">
              <div className="mb-2 flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ee-text">
                <TriangleAlert className="size-3.5 text-ee-warning" strokeWidth={1.75} />
                Live breaches
              </div>
              {!draft.alertsEnabled ? (
                <p className="font-mono text-xs text-ee-muted">Alerts disabled.</p>
              ) : liveAlerts.length === 0 ? (
                <p className="font-mono text-xs text-ee-muted">No active threshold breaches.</p>
              ) : (
                <ul className="space-y-2">
                  {liveAlerts.map((a, i) => (
                    <li
                      key={`${a.camId}-${a.type}-${i}`}
                      className={`rounded-sm border px-2.5 py-2 font-mono text-[11px] ${
                        a.severity === "critical"
                          ? "border-ee-critical/40 bg-ee-critical/10 text-ee-critical"
                          : "border-ee-warning/40 bg-ee-warning/10 text-ee-warning"
                      }`}
                    >
                      <span className="text-ee-muted">[{a.camId}]</span> {a.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-ee-border px-4 py-4">
            <button
              type="button"
              className="cursor-pointer rounded-sm px-4 py-2 font-mono text-sm text-ee-muted hover:bg-ee-inset hover:text-ee-text"
              onClick={() => setNotificationsOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="font-display inline-flex cursor-pointer items-center gap-2 rounded-sm bg-ee-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ee-cta-ink shadow-[0_0_18px_rgba(57,255,106,0.2)] hover:brightness-110"
              onClick={save}
            >
              <Save className="size-4" strokeWidth={1.75} />
              Save thresholds
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
