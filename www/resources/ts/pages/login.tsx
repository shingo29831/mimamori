"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Users, Home } from "lucide-react"

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "") // 例: http://localhost

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"" | "staff" | "family">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email,                // サーバは email 必須
          password,
          role,                 // サーバ側でも厳密照合（必須）
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // サーバからのメッセージを優先表示
        const msg =
          data?.message ||
          data?.errors?.email?.[0] ||
          data?.errors?.password?.[0] ||
          data?.errors?.role?.[0] ||
          "ログインに失敗しました。入力内容をご確認ください。"
        throw new Error(msg)
      }

      // token 保存（以降のAPIで使用）
      if (data?.token) {
        localStorage.setItem("token", data.token)
      }

      // 念のためクライアント側でもロール整合
      if (data?.user?.role !== role) {
        localStorage.removeItem("token")
        throw new Error("権限が違います。選択し直してください。")
      }

      // ロールに応じて遷移
      if (role === "staff") {
        window.location.href = "/dashboard/staff"
      } else {
        window.location.href = "/dashboard/family"
      }
    } catch (err: any) {
      setError(err?.message ?? "エラーが発生しました。時間をおいて再度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-3 rounded-full">
              <Home className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">高齢者宅見守りシステム</h2>
          <p className="mt-2 text-gray-600">安心・安全な在宅見守りサービス</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ログイン</CardTitle>
            <CardDescription>アカウント情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">ユーザー種別</Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        職員
                      </div>
                    </SelectItem>
                    <SelectItem value="family">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        ご家族
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={!role || loading}>
                {loading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>システムに関するお問い合わせは職員までご連絡ください</p>
        </div>
      </div>
    </div>
  )
}
