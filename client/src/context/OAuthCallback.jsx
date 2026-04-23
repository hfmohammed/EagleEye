import { useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

const OAuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    axios
      .get(
        `${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/auth/user`,
        { withCredentials: true },
      )
      .then(async (res) => {
        const user = res.data
        if (user.email && user.access_token && user.refresh_token) {
          localStorage.setItem("access_token", user.access_token)
          localStorage.setItem("refresh_token", user.refresh_token)
          localStorage.setItem("username", user.email)
          localStorage.setItem("fps", user.fps)
          localStorage.setItem("rtspLinks", JSON.stringify(user.rtspLinks))
          localStorage.setItem("inputSource", user.inputSource)
          localStorage.setItem("enableAnnotationsRef", user.enableAnnotationsRef)
          navigate("/")
        } else {
          navigate("/login")
        }
      })
      .catch(() => navigate("/login"))
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ee-base px-4">
      <div className="ee-surface-deep flex flex-col items-center gap-3 rounded-sm border border-ee-border px-10 py-8">
        <Loader2 className="size-7 animate-spin rounded-sm text-ee-accent" aria-hidden />
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ee-text">Eagle Eye</p>
        <p className="text-center font-mono text-xs text-ee-muted">Validating session token…</p>
      </div>
    </div>
  )
}

export default OAuthCallback
