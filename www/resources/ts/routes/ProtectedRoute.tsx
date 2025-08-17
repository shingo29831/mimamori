import { useEffect, useState, type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

type Role = "staff" | "family"
type Props = { roles?: Role[]; children: ReactNode }  // ★

async function me() {
  const token = localStorage.getItem("token")
  const res = await fetch("/api/me", {
    headers: { Authorization: token ? `Bearer ${token}` : "", Accept: "application/json" },
  })
  if (!res.ok) throw new Error("unauth")
  return (await res.json()) as { role: Role }
}

function Spinner() {
  return <div className="min-h-screen grid place-items-center text-gray-600">読み込み中...</div>
}

export default function ProtectedRoute({ roles, children }: Props) {
  const location = useLocation()
  const [state, setState] = useState<"loading" | "ok" | "redirect">("loading")
  const [dest, setDest] = useState("/login")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { setDest("/login"); setState("redirect"); return }
    ;(async () => {
      try {
        const u = await me()
        if (roles && !roles.includes(u.role)) {
          setDest(u.role === "staff" ? "/dashboard/staff" : "/dashboard/family")
          setState("redirect")
        } else {
          setState("ok")
        }
      } catch {
        localStorage.removeItem("token")
        setDest("/login")
        setState("redirect")
      }
    })()
  }, [location.pathname, roles])

  if (state === "loading") return <Spinner />
  if (state === "redirect") return <Navigate to={dest} replace state={{ from: location }} />
  return <>{children}</>
}
