"use client"

import { useContext, useEffect, useState } from "react"
import { SettingsContext } from "../context/SettingsContext"
import { X, User, Save } from "lucide-react"

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Australia/Sydney",
]

export default function EnhancedProfile() {
  const { profileOpen, setProfileOpen, profilePrefs, setProfilePrefs } = useContext(SettingsContext)
  const [displayName, setDisplayName] = useState("")
  const [notes, setNotes] = useState("")
  const [timezone, setTimezone] = useState("UTC")

  useEffect(() => {
    if (!profileOpen) return
    const u = localStorage.getItem("username") || ""
    setDisplayName(profilePrefs.displayName?.trim() || u)
    setNotes(profilePrefs.notes || "")
    setTimezone(profilePrefs.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")
  }, [profileOpen, profilePrefs])

  if (!profileOpen) return null

  const handleSave = () => {
    setProfilePrefs({
      displayName: displayName.trim(),
      notes: notes.trim(),
      timezone,
    })
    setProfileOpen(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]" onClick={() => setProfileOpen(false)} aria-hidden />
      <div className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md shadow-2xl">
        <div
          className="ee-surface-deep flex h-full w-full flex-col border-l border-ee-border"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-ee-border px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-ee-border bg-ee-base text-ee-accent">
                <User className="size-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h2 id="profile-title" className="font-display text-base font-bold uppercase tracking-[0.14em] text-ee-text">
                  Profile
                </h2>
                <p className="font-mono text-[11px] text-ee-muted">Operator display & session notes</p>
              </div>
            </div>
            <button
              type="button"
              className="cursor-pointer rounded-sm p-2 text-ee-muted hover:bg-ee-inset hover:text-ee-text"
              onClick={() => setProfileOpen(false)}
              aria-label="Close profile"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
            <div className="rounded-sm border border-ee-border bg-ee-base/40 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-ee-muted">Account id</p>
              <p className="mt-1 truncate font-mono text-sm text-ee-text">{localStorage.getItem("username") || "N/A"}</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-display" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ee-muted">
                Display name
              </label>
              <input
                id="profile-display"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-sm border border-ee-border bg-ee-base px-3 py-2 font-mono text-sm text-ee-text placeholder:text-ee-muted focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
                placeholder="Shown in header"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-tz" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ee-muted">
                Timezone
              </label>
              <select
                id="profile-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-sm border border-ee-border bg-ee-base px-3 py-2 font-mono text-sm text-ee-text focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
              >
                {!TIMEZONES.includes(timezone) && (
                  <option value={timezone}>{timezone}</option>
                )}
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-notes" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ee-muted">
                Operator notes
              </label>
              <textarea
                id="profile-notes"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shift handoff, site codes, camera notes…"
                className="w-full resize-y rounded-sm border border-ee-border bg-ee-base px-3 py-2 font-mono text-sm text-ee-text placeholder:text-ee-muted focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-ee-border px-4 py-4">
            <button
              type="button"
              className="cursor-pointer rounded-sm px-4 py-2 font-mono text-sm text-ee-muted hover:bg-ee-inset hover:text-ee-text"
              onClick={() => setProfileOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="font-display inline-flex cursor-pointer items-center gap-2 rounded-sm bg-ee-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ee-cta-ink shadow-[0_0_18px_rgba(57,255,106,0.2)] hover:brightness-110"
              onClick={handleSave}
            >
              <Save className="size-4" strokeWidth={1.75} />
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
