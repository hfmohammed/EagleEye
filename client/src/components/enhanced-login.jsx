"use client"

import { useContext, useEffect, useState } from "react"
import { AuthenticationContext } from "../context/AuthenticationContext.jsx"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { SettingsContext } from "../context/SettingsContext.jsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Shield, Camera, Lock, User, AlertCircle } from "lucide-react"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthenticationContext)
  const {
    isCameraEnabled,
    setIsCameraEnabled,
    toggleCamera,
    inFlight,
    switchSource,
    setSwitchSource,
    fps,
    setFps,
    saveSettings,
    rtspLinks,
    setRtspLinks,
    inputSource,
    setInputSource,
    settingsOpen,
    setSettingsOpen,
    selectedTab,
    setSelectedTab,
    enableAnnotationsRef,
  } = useContext(SettingsContext)
  const navigate = useNavigate()

  useEffect(() => {
    setIsLoading(false)
    axios
      .post(
        `${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/login`,
        {
          username: localStorage.getItem("username") || "",
          password: "",
          access_token: localStorage.getItem("access_token") || "",
          refresh_token: localStorage.getItem("refresh_token") || "",
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      )
      .then((res) => {
        console.log(res.data)
        if (res.data && res.data.status_code === 200) {
          localStorage.setItem("access_token", res.data.access_token)
          localStorage.setItem("refresh_token", res.data.refresh_token)
          localStorage.setItem("username", res.data.username)
          setFps(res.data.fps)
          localStorage.setItem("fps", res.data.fps)
          setInputSource(res.data.inputSource)
          localStorage.setItem("inputSource", res.data.inputSource)
          enableAnnotationsRef.current = JSON.parse(localStorage.getItem("enableAnnotationsRef") || "false")
          localStorage.setItem("enableAnnotationsRef", JSON.stringify(enableAnnotationsRef.current))
          setRtspLinks(res.data.rtspLinks)
          localStorage.setItem("rtspLinks", JSON.stringify(res.data.rtspLinks))
          setErrorMessage("")
          setIsAuthenticated(true)
          navigate("/")
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const oAuthSignIn = () => {
    window.location.href = `${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/auth/login`
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setErrorMessage("Username and password are required.")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    axios
      .post(
        `${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/login`,
        {
          username,
          password,
          access_token: localStorage.getItem("access_token") || "",
          refresh_token: localStorage.getItem("refresh_token") || "",
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      )
      .then((res) => {
        if (res.data.status_code === 200) {
          console.log(res.data)
          localStorage.setItem("access_token", res.data.access_token)
          localStorage.setItem("refresh_token", res.data.refresh_token)
          localStorage.setItem("username", res.data.username)
          setFps(res.data.fps)
          localStorage.setItem("fps", res.data.fps)
          setInputSource(res.data.inputSource)
          localStorage.setItem("inputSource", res.data.inputSource)
          enableAnnotationsRef.current = res.data.enableAnnotationsRef
          localStorage.setItem("enableAnnotationsRef", JSON.stringify(enableAnnotationsRef.current))
          setRtspLinks(res.data.rtspLinks)
          localStorage.setItem("rtspLinks", JSON.stringify(res.data.rtspLinks))
          setErrorMessage("")
          setIsAuthenticated(true)
          navigate("/")
        } else {
          setErrorMessage(res.data.message)
        }
      })
      .catch((error) => {
        setErrorMessage("Login failed. Please try again.")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-white">CCTV Dashboard</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to access your security monitoring system
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {errorMessage && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:cursor-pointer hover:text-slate-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:cursor-pointer hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-2.5 shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full border border-slate-600 bg-slate-700/30 text-white hover:cursor-pointer hover:bg-slate-700/50 hover:border-slate-500 py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={oAuthSignIn}
            disabled={isLoading}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </div>
          </button>

        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-400 hover:cursor-pointer hover:text-blue-300 font-medium hover:underline transition-colors"
            >
              Sign up
            </button>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Secure</span>
            </span>
            <span className="flex items-center space-x-1">
              <Camera className="w-3 h-3" />
              <span>Monitored</span>
            </span>
            <span className="flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Encrypted</span>
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Login
