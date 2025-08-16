import { useEffect, useState, type ReactNode } from "react"
import { Navigate } from "react-router-dom"

type Role = "staff" | "family"
type Props = { children: ReactNode }

async function me() {
  const token = localStorage.getItem("token")
  if (!token) throw new Error("no token")
  const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
  if (!res.ok) throw new Error("unauth")
  return (await res.json()) as { role: Role }
}

export default function PublicOnlyRoute({ children }: Props) {
  const [dest, setDest] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    ;(async () => {
      try {
        const u = await me()
        setDest(u.role === "staff" ? "/dashboard/staff" : "/dashboard/family")
      } catch {}
    })()
  }, [])

  if (dest) return <Navigate to={dest} replace />
  return <>{children}</>
}
