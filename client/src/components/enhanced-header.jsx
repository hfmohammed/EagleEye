"use client"

import { useContext, useState, useEffect, useRef } from "react"
import { SettingsContext } from "../context/SettingsContext"
import axios from "axios"
import { AuthenticationContext } from "../context/AuthenticationContext.jsx"
import { Settings, LogOut, User, Bell, Shield, Eye, ChevronDown, Menu, X, Activity, Clock, Wifi } from "lucide-react"

const Header = () => {
  const { settingsOpen, setSettingsOpen } = useContext(SettingsContext)
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthenticationContext)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3) // Mock notification count
  const [currentTime, setCurrentTime] = useState(new Date())
  const userMenuRef = useRef(null)

  // Get username from localStorage
  const username = localStorage.getItem("username") || "Admin"

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Close user menu when clicking outside
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
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data.status_code === 200) {
        setIsAuthenticated(false)
        localStorage.clear()
      } else {
        setIsAuthenticated(false)
        console.log("Logout failed:", response.data.message)
      }
    } catch (err) {
      setIsAuthenticated(false)
      console.error("Logout error:", err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 px-4 md:px-6 py-4 sticky top-0 z-50 shadow-2xl">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">EagleEye</h1>
              <p className="text-xs text-slate-400 hidden md:block">Security Monitoring</p>
            </div>
          </div>
        </div>

        {/* Center Section - Status Indicators */}
        <div className="hidden lg:flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-slate-300">System Online</span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Wifi className="w-4 h-4" />
            <span>Connected</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            className={`p-2 rounded-lg transition-all duration-200 ${
              settingsOpen
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              className="flex items-center space-x-2 md:space-x-3 p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{username}</p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                {/* User Info */}
                <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{username}</p>
                      <p className="text-slate-400 text-sm">Administrator</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-green-400">Online</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                    <User className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>

                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                    <Shield className="w-4 h-4" />
                    <span>Security</span>
                  </button>

                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                    <Activity className="w-4 h-4" />
                    <span>Activity Log</span>
                  </button>

                  <div className="border-t border-slate-700 my-2"></div>

                  <button
                    className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    onClick={signout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-slate-700">
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300 text-sm">System Online</span>
              </div>
              <span className="text-slate-400 text-sm">{currentTime.toLocaleTimeString()}</span>
            </div>

            <button className="w-full flex items-center space-x-3 p-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
              {notifications > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
