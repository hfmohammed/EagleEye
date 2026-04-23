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
import { Eye, EyeOff, Crosshair, LogIn, User, Lock, AlertCircle, Loader2 } from "lucide-react"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setIsAuthenticated } = useContext(AuthenticationContext)
  const {
    setFps,
    setRtspLinks,
    setInputSource,
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
        { headers: { "Content-Type": "application/json" } },
      )
      .then((res) => {
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
      .finally(() => setIsLoading(false))
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
        { headers: { "Content-Type": "application/json" } },
      )
      .then((res) => {
        if (res.data.status_code === 200) {
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
      .catch(() => setErrorMessage("Login failed. Please try again."))
      .finally(() => setIsLoading(false))
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ee-base p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(57, 255, 106, 0.14) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <Card className="relative z-10 w-full max-w-md rounded-sm border-ee-border bg-ee-elevate/90 shadow-xl ring-1 ring-ee-border/60 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-sm border border-ee-accent/35 bg-ee-inset text-ee-accent">
            <Crosshair className="size-7" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <CardTitle className="font-display text-2xl font-bold uppercase tracking-[0.22em] text-ee-text">Eagle Eye</CardTitle>
            <CardDescription className="font-mono text-xs text-ee-muted">Operator access, command console</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {errorMessage && (
            <Alert variant="destructive" className="border-ee-critical/50 bg-ee-critical/10 text-ee-critical">
              <AlertCircle className="size-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-ee-text">
                Username
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ee-muted" />
                <Input
                  id="username"
                  type="text"
                  placeholder="you"
                  className="border-ee-border bg-ee-base pl-10 text-ee-text placeholder:text-ee-muted focus-visible:ring-ee-accent/30"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-ee-text">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ee-muted" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="border-ee-border bg-ee-base pl-10 pr-10 text-ee-text placeholder:text-ee-muted focus-visible:ring-ee-accent/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ee-muted hover:text-ee-text"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="font-display w-full rounded-sm bg-ee-accent px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-ee-cta-ink shadow-[0_0_24px_rgba(57,255,106,0.25)] hover:brightness-110"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <LogIn className="size-4" />
                  Sign in
                </span>
              )}
            </Button>
          </form>

          <div className="relative py-1">
            <Separator className="bg-ee-inset" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-ee-elevate px-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-ee-muted">
              or
            </span>
          </div>

            <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-ee-border bg-ee-base py-2.5 font-mono text-sm font-medium text-ee-text transition-colors hover:border-ee-muted hover:bg-ee-inset disabled:opacity-50"
            onClick={oAuthSignIn}
            disabled={isLoading}
          >
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
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
            Continue with Google
          </button>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-ee-border/80 pt-2">
          <p className="text-center text-sm text-ee-muted">
            No account?{" "}
            <button type="button" onClick={() => navigate("/signup")} className="font-medium text-ee-text underline-offset-4 hover:text-ee-text hover:underline">
              Create one
            </button>
          </p>
          <div className="flex justify-center gap-6 text-[11px] text-ee-muted">
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" />
              TLS to API
            </span>
            <span className="inline-flex items-center gap-1">
              <Crosshair className="size-3" />
              Eagle Eye
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Login
