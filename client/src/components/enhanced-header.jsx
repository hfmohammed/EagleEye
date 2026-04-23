"use client"

import { useContext, useState, useEffect, useRef, useMemo } from "react"
import { SettingsContext } from "../context/SettingsContext"
import { DataContext } from "../context/DataContext"
import { collectAllStreamAlerts } from "../lib/streamAlerts"
import axios from "axios"
import { AuthenticationContext } from "../context/AuthenticationContext.jsx"
import {
  Settings,
  LogOut,
  User,
  Bell,
  Crosshair,
  ChevronDown,
  Menu,
  X,
  BarChart2,
  Clock,
  Loader2,
} from "lucide-react"

const Header = () => {
  const {
    settingsOpen,
    setSettingsOpen,
    setAnalyticsOpen,
    setProfileOpen,
    setNotificationsOpen,
    notificationPrefs,
    profilePrefs,
  } = useContext(SettingsContext)
  const { cameraData } = useContext(DataContext)
  const { setIsAuthenticated } = useContext(AuthenticationContext)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const userMenuRef = useRef(null)

  const username = localStorage.getItem("username") || "OPERATOR"
  const displayLabel = (profilePrefs?.displayName && String(profilePrefs.displayName).trim()) || username

  const alertCount = useMemo(
    () => collectAllStreamAlerts(cameraData, notificationPrefs).length,
    [cameraData, notificationPrefs],
  )

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const signout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/logout`,
        {
          access_token: localStorage.getItem("access_token") || "",
          refresh_token: localStorage.getItem("refresh_token") || "",
        },
        { headers: { "Content-Type": "application/json" } },
      )
      if (response.data.status_code === 200) {
        setIsAuthenticated(false)
        localStorage.clear()
      } else {
        setIsAuthenticated(false)
      }
    } catch {
      setIsAuthenticated(false)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="ee-surface sticky top-0 z-40 border-b border-ee-border/60 px-3 py-2 backdrop-blur-md md:px-5 md:py-3">
      <div className="relative flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 md:gap-4">
          <button
            type="button"
            className="rounded-sm p-2 text-ee-muted transition-colors hover:bg-ee-inset hover:text-ee-text md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-ee-accent/35 bg-ee-inset text-ee-accent shadow-[0_0_16px_rgba(57,255,106,0.12)]">
              <Crosshair className="size-5" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0 leading-none">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-ee-muted">Eagle Eye</p>
              <h1 className="font-display truncate text-xl font-bold uppercase tracking-[0.08em] text-ee-text md:text-2xl">
                Command
              </h1>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 md:gap-6 lg:flex">
          <div className="flex items-center gap-2 border border-ee-border bg-ee-inset px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ee-muted">
            <span
              className="size-2 shrink-0 rounded-sm bg-ee-accent shadow-[0_0_10px_rgba(57,255,106,0.7)]"
              aria-hidden
            />
            <span className="text-ee-accent">Live</span>
            <span className="text-ee-border">|</span>
            <span className="tabular-nums text-ee-text">{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            className="relative rounded-sm p-2 text-ee-muted transition-colors hover:bg-ee-inset hover:text-ee-text"
            aria-label="Notifications and thresholds"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="size-5" strokeWidth={1.75} />
            {alertCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-sm bg-ee-critical px-1 text-xs font-bold leading-none text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`rounded-sm p-2 transition-colors ${
              settingsOpen ? "bg-ee-inset text-ee-accent" : "text-ee-muted hover:bg-ee-inset hover:text-ee-text"
            }`}
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-label="Configuration"
          >
            <Settings className="size-5" strokeWidth={1.75} />
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-sm py-1 pl-1 pr-1.5 text-ee-text transition-colors hover:bg-ee-inset sm:pr-2"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="flex size-8 items-center justify-center rounded-sm border border-ee-border bg-ee-elevate text-ee-muted">
                <User className="size-4" strokeWidth={1.75} />
              </div>
              <div className="hidden text-left md:block">
                <p className="max-w-[9rem] truncate font-mono text-xs font-medium uppercase tracking-wide text-ee-text">
                  {displayLabel}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-ee-muted">Session</p>
              </div>
              <ChevronDown
                className={`hidden size-4 text-ee-muted sm:block ${userMenuOpen ? "rotate-180" : ""} transition-transform`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 overflow-hidden rounded-sm border border-ee-border bg-ee-elevate shadow-2xl">
                <div className="border-b border-ee-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-ee-border bg-ee-inset text-ee-muted">
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium text-ee-text">{displayLabel}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ee-muted">Authenticated</p>
                    </div>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left font-mono text-xs text-ee-muted hover:bg-ee-inset hover:text-ee-text"
                    onClick={() => {
                      setProfileOpen(true)
                      setUserMenuOpen(false)
                    }}
                  >
                    <User className="size-3.5 shrink-0" />
                    Profile
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left font-mono text-xs text-ee-muted hover:bg-ee-inset hover:text-ee-text"
                    onClick={() => {
                      setAnalyticsOpen(true)
                      setUserMenuOpen(false)
                    }}
                  >
                    <BarChart2 className="size-3.5 shrink-0" />
                    Analytics
                  </button>
                  <div className="my-1 h-px bg-ee-border" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left font-mono text-xs text-ee-critical hover:bg-ee-critical/10"
                    onClick={signout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="size-3.5 shrink-0 animate-spin" />
                    ) : (
                      <LogOut className="size-3.5 shrink-0" />
                    )}
                    Terminate session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mt-2 border-t border-ee-border pt-2 md:hidden">
          <div className="flex flex-col gap-2 rounded-sm border border-ee-border bg-ee-inset p-2">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wide text-ee-muted">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-sm bg-ee-accent shadow-[0_0_8px_rgba(57,255,106,0.6)]" />
                <span className="text-ee-accent">Live</span>
              </span>
              <Clock className="size-3.5 opacity-60" />
              <span className="tabular-nums text-ee-text">{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
