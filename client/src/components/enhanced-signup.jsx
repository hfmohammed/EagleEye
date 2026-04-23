"use client"

import { useState, useContext, useEffect } from "react"
import { AuthenticationContext } from "../context/AuthenticationContext.jsx"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Crosshair,
  AlertCircle,
  Loader2,
} from "lucide-react"

const Signup = () => {
  const { setIsAuthenticated } = useContext(AuthenticationContext)
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const oAuthSignIn = () => {
    window.location.href = `${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/auth/login`
  }

  useEffect(() => {
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
        if (res.data.status_code === 200) {
          localStorage.setItem("access_token", res.data.access_token)
          localStorage.setItem("refresh_token", res.data.refresh_token)
          localStorage.setItem("username", res.data.username)
          setIsAuthenticated(true)
          setErrorMessage("")
          navigate("/")
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !email || !password) {
      setErrorMessage("All fields are required.")
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.")
      return
    }
    setIsLoading(true)
    setErrorMessage("")
    await axios
      .post(
        `${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/signup`,
        { username, password, email },
      )
      .then((res) => {
        if (res.data.status_code === 201) {
          setIsAuthenticated(true)
          setErrorMessage("")
          localStorage.setItem("access_token", res.data.access_token)
          localStorage.setItem("refresh_token", res.data.refresh_token)
          localStorage.setItem("username", res.data.username)
          navigate("/")
        } else {
          setErrorMessage(res.data.message)
        }
      })
      .catch(() => setErrorMessage("Signup failed. Please try again."))
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

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-sm border border-ee-border bg-ee-elevate/90 shadow-xl ring-1 ring-ee-border/60 backdrop-blur-sm">
        <div className="border-b border-ee-border px-8 pb-6 pt-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-sm border border-ee-accent/35 bg-ee-inset text-ee-accent">
            <UserPlus className="size-7" strokeWidth={1.75} />
          </div>
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-ee-muted">Eagle Eye</p>
          <h1 className="mt-2 font-display text-xl font-bold uppercase tracking-[0.18em] text-ee-text">Provision access</h1>
          <p className="mt-1 font-mono text-xs text-ee-muted">Credentials for the command console</p>
        </div>

        <div className="space-y-5 px-8 pb-6">
          {errorMessage && (
            <div className="flex gap-2 rounded-sm border border-ee-critical/50 bg-ee-critical/10 px-3 py-2.5 font-mono text-sm text-ee-critical">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ee-muted">
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ee-muted" />
                <input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  className="w-full rounded-sm border border-ee-border bg-ee-base py-2.5 pl-10 pr-3 font-mono text-sm text-ee-text placeholder:text-ee-muted focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ee-muted">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ee-muted" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-sm border border-ee-border bg-ee-base py-2.5 pl-10 pr-3 font-mono text-sm text-ee-text placeholder:text-ee-muted focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ee-muted">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ee-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  className="w-full rounded-sm border border-ee-border bg-ee-base py-2.5 pl-10 pr-10 font-mono text-sm text-ee-text placeholder:text-ee-muted focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
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

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ee-muted">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ee-muted" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  className="w-full rounded-sm border border-ee-border bg-ee-base py-2.5 pl-10 pr-10 font-mono text-sm text-ee-text placeholder:text-ee-muted focus:border-ee-accent focus:outline-none focus:ring-2 focus:ring-ee-accent/25"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ee-muted hover:text-ee-text"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <ul className="space-y-1 font-mono text-[11px] text-ee-muted">
              <li className={password.length >= 6 ? "text-ee-accent" : ""}>At least 6 characters</li>
              <li className={password === confirmPassword && password.length > 0 ? "text-ee-accent" : ""}>
                Passwords match
              </li>
            </ul>

            <button
              type="submit"
              className="font-display flex w-full items-center justify-center gap-2 rounded-sm bg-ee-accent py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-ee-cta-ink shadow-[0_0_24px_rgba(57,255,106,0.25)] hover:brightness-110 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  Create account
                </>
              )}
            </button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-x-0 top-1/2 h-px bg-ee-inset" />
            <p className="relative mx-auto w-fit bg-ee-elevate px-2 text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-ee-muted">
              or
            </p>
          </div>

            <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-ee-border bg-ee-base py-2.5 font-mono text-sm font-medium text-ee-text hover:border-ee-muted hover:bg-ee-inset disabled:opacity-50"
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
        </div>

        <div className="space-y-4 border-t border-ee-border px-8 py-6">
          <p className="text-center text-sm text-ee-muted">
            Already registered?{" "}
            <button type="button" onClick={() => navigate("/login")} className="font-medium text-ee-text underline-offset-4 hover:text-ee-text hover:underline">
              Sign in
            </button>
          </p>
          <div className="flex justify-center gap-6 text-[11px] text-ee-muted">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3" />
              Account
            </span>
            <span className="inline-flex items-center gap-1">
              <Crosshair className="size-3" />
              Eagle Eye
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
