"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Thermometer, Droplets, DoorOpen, AlertTriangle, Heart, Clock, Wifi, Home, User, ChevronDown } from 'lucide-react'
import { LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "")
// 先頭の定数群の近くに追加
const SENSOR_READINGS_ENDPOINT =
(API_BASE ? `${API_BASE}/api/admin/sensor-readings` : `/api/admin/sensor-readings`);

type SensorItem = {
    sensorId: string;
    type: "MT10" | "MT20" | "MT30" | "MV23" | "other";
    status: "active" | "inactive";
    lastSeen: string | null;
};

type BackendHome = {
    homeId: string;
    homeName: string;
    residentName?: string;
    address: string;
    temperature: number;   // 平均
    humidity: number;      // 平均
    doorStatus: "open" | "closed";
    lastActivity: string;
    fallDetected: boolean;
    alerts: Array<{
        type: "fall" | "temperature" | "humidity" | "door" | "activity";
        message: string;
        received_at: string;
        severity: "high" | "medium" | "low";
    }>;
    sensors: SensorItem[];
        recentEvents?: Array<{
        sensorId?: string;
        metric: "door" | "temperature" | "humidity" | "fall" | "activity";
        value?: any;
        received_at: string;        // ISO or human-readable
        note?: string;            // 表示用の任意メッセージ
        severity?: "high" | "medium" | "low";
    }>;
};

interface ResidentStatus {
  residentId: string
  residentName: string
  homeId: string
  homeName: string
  address: string
  temperature: number
  humidity: number
  doorStatus: "open" | "closed"
  lastActivity: string
  relationship: string
  fallDetected: boolean
  alerts: Array<{
    type: "fall" | "temperature" | "humidity" | "door" | "activity"
    message: string
    received_at: string
    severity: "high" | "medium" | "low"
  }>
}

interface FamilyUserData {
  userId: string
  userName: string
  email: string
  linkedResidents: ResidentStatus[]
}

export default function FamilyDashboard() {
    const [familyData, setFamilyData] = useState<FamilyUserData | null>(null)
    const [selectedResidentId, setSelectedResidentId] = useState<string>("")
    const [wsConnected, setWsConnected] = useState(false)
    // コンポーネント内の state に追加
    const [homesData, setHomesData] = useState<BackendHome[]>([]);
    const navigate = useNavigate()
    const handleLogout = async () => {
        const token = localStorage.getItem("token")
        try {
        if (token) {
            await fetch(`${API_BASE}/api/logout`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            })
        }
        } catch {
        // 通信失敗でもクライアント側はログアウトさせる
        } finally {
        localStorage.removeItem("token")
        navigate("/login") // ルーティング先はプロジェクトのログインURLに合わせてください
        // window.location.href = "/login" でもOK
        }
    }
    
    useEffect(() => {
        let aborted = false;
        let timer: number | undefined;
        let interval = 10_000;         // 10s
        const INTERVAL_MAX = 60_000;   // 60s

        const fetchHomes = async () => {
            const controller = new AbortController();
            try {
                const token = localStorage.getItem("token") ?? "";
                const res = await fetch(SENSOR_READINGS_ENDPOINT, {
                    headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    signal: controller.signal,
                });

                if (res.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login", { replace: true });
                    return;
                }
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data: BackendHome[] = await res.json();
                if (aborted) return;
                setHomesData(Array.isArray(data) ? data : []);
                setWsConnected(true);
                interval = 10_000; // 成功したらリセット
                const linkedResidents = (Array.isArray(data) ? data : []).map((h) => ({
                    residentId: h.homeId, // 家単位しかなければ homeId を代用
                    residentName: h.residentName ?? h.homeName,
                    homeId: h.homeId,
                    homeName: h.homeName,
                    address: h.address,
                    temperature: h.temperature,
                    humidity: h.humidity,
                    doorStatus: h.doorStatus,
                    lastActivity: h.lastActivity,
                    relationship: "",            // 家族との続柄が別APIならここは空でOK
                    fallDetected: h.fallDetected,
                    alerts: h.alerts ?? [],
                }));

                setFamilyData((prev) => {
                    const base = prev ?? { userId: "me", userName: "ご家族", email: "", linkedResidents: [] };
                    return { ...base, linkedResidents };
                });
                // ★ 選択IDが未設定 or 無効なら先頭を選ぶ
                setSelectedResidentId((cur) => {
                    if (!linkedResidents.length) return "";
                    return linkedResidents.some(r => r.residentId === cur)
                    ? cur
                    : linkedResidents[0].residentId;
                });
            } catch (e) {
            if ((e as any)?.name !== "AbortError") {
                console.error("GET /api/admin/sensor-readings failed:", e);
                setWsConnected(false);
                interval = Math.min(interval * 2, INTERVAL_MAX); // バックオフ
            }
            } finally {
            if (!aborted) {
                if (timer) clearTimeout(timer);
                timer = window.setTimeout(fetchHomes, interval);
            }
            }
        };

        fetchHomes();
        const onVisible = () => {
            if (document.visibilityState === "visible") {
            if (timer) clearTimeout(timer);
            interval = 10_000;
            fetchHomes();
            }
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            aborted = true;
            if (timer) clearTimeout(timer);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [navigate]);


  if (!familyData || homesData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>データを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  const selectedResident = familyData.linkedResidents.find(
    (resident) => resident.residentId === selectedResidentId
  )

    

  if (!selectedResident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p>高齢者が選択されていません</p>
        </div>
      </div>
    )
  }
    const selectedHome: BackendHome | undefined = homesData.find(
        h => h.homeId === selectedResident.homeId
    );

  const getTempColor = (temp: number) => {
    if (temp > 26) return "text-red-600"
    if (temp < 18) return "text-blue-600"
    return "text-green-600"
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  // 緊急度の高いアラートがある高齢者の数
  const urgentAlertsCount = familyData.linkedResidents.reduce(
    (count, resident) => count + resident.alerts.filter(alert => alert.severity === "high").length,
    0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">ご家族用ダッシュボード</h1>
              <p className="text-gray-600">
                {familyData.userName}さん - 見守り対象: {familyData.linkedResidents.length}名
              </p>
            </div>
            
            {/* 高齢者選択 */}
            {familyData.linkedResidents.length > 1 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">表示対象:</span>
                </div>
                <Select value={selectedResidentId} onValueChange={setSelectedResidentId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="高齢者を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyData.linkedResidents.map((resident) => (
                      <SelectItem key={resident.residentId} value={resident.residentId}>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <div className="font-medium">{resident.residentName}</div>
                            <div className="text-xs text-gray-500">
                              {resident.homeId} - {resident.relationship}
                              {resident.alerts.some(alert => alert.severity === "high") && (
                                <span className="ml-2 text-red-500">🚨</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center gap-4 ml-4">
              <div className="flex items-center gap-2">
                <Wifi className={`h-4 w-4 ${wsConnected ? "text-green-500" : "text-red-500"}`} />
                <span className="text-sm text-gray-600">{wsConnected ? "リアルタイム接続中" : "接続エラー"}</span>
              </div>
              {urgentAlertsCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  緊急 {urgentAlertsCount}件
                </Badge>
              )}
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-2 mr-1" />
                    ログアウト
                </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 他の高齢者の緊急アラート表示 */}
          {familyData.linkedResidents
            .filter(resident => resident.residentId !== selectedResidentId)
            .filter(resident => resident.alerts.some(alert => alert.severity === "high"))
            .map((resident) => (
              <Alert key={resident.residentId} className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-red-700">
                        {resident.residentName}さん（{resident.homeId}）に緊急アラートがあります
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        {resident.alerts.filter(alert => alert.severity === "high").map(alert => alert.message).join(", ")}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => setSelectedResidentId(resident.residentId)}
                    >
                      切り替えて確認
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))}

          {/* 選択された高齢者の情報カード */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    {selectedResident.residentName}さん
                  </CardTitle>
                    <CardDescription>
                        <span className="inline-flex items-center gap-2 mt-1">
                            <Home className="h-4 w-4" />
                            {selectedResident.homeName}
                        </span>
                        <span className="block text-sm text-gray-500 mt-1">
                            宅ID: {selectedResident.homeId}
                        </span>
                        <span className="block text-sm text-gray-500">
                            {selectedResident.address}
                        </span>
                        <span className="block text-sm mt-1">
                            あなたとの関係: {selectedResident.relationship}
                        </span>
                    </CardDescription>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  見守り中
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* 転倒検知アラート */}
          {selectedResident.fallDetected && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription>
                <div className="font-medium text-red-700">緊急：転倒の可能性が検知されました</div>
                <div className="text-sm text-red-600 mt-1">
                  10秒以上継続して転倒状態が検知されています。すぐに確認してください。
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    緊急連絡
                  </Button>
                  <Button size="sm" variant="outline">
                    職員に連絡
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
            {selectedHome && (
                <Card>
                    <CardHeader>
                    <CardTitle>センサー一覧（{selectedHome.homeName}）</CardTitle>
                    <CardDescription>タイプ／状態／最終受信時刻</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {selectedHome.sensors.length === 0 ? (
                        <div className="text-sm text-gray-500">登録センサーがありません。</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedHome.sensors.map(s => (
                            <div
                            key={s.sensorId}
                            className={`flex items-center justify-between p-3 rounded border
                                ${s.status === "active" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}
                            `}
                            >
                            <div className="space-y-1">
                                <div className="font-medium">{s.sensorId}</div>
                                <div className="text-xs text-gray-500">種類: {s.type}</div>
                                <div className="text-xs text-gray-500">
                                最終受信: {s.lastSeen ? s.lastSeen : "—"}
                                </div>
                            </div>
                            <Badge variant={s.status === "active" ? "default" : "destructive"}>
                                {s.status === "active" ? "稼働中" : "停止"}
                            </Badge>
                            </div>
                        ))}
                        </div>
                    )}
                    </CardContent>
                </Card>
            )}

          {/* 現在の状況 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">室温</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTempColor(selectedResident.temperature)}`}>
                  {selectedResident.temperature.toFixed(1)}°C
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedResident.temperature > 26 ? "やや暑め" : selectedResident.temperature < 18 ? "やや寒め" : "適正範囲内"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">湿度</CardTitle>
                <Droplets className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedResident.humidity.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">
                  {selectedResident.humidity > 70 ? "やや高め" : selectedResident.humidity < 30 ? "やや低め" : "快適レベル"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">最終活動</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedResident.lastActivity}</div>
                <div className="flex items-center gap-2 mt-1">
                  <DoorOpen className="h-3 w-3 text-gray-500" />
                  <Badge variant={selectedResident.doorStatus === "open" ? "default" : "secondary"} className="text-xs">
                    玄関ドア{selectedResident.doorStatus === "open" ? "開" : "閉"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* アラートセクション */}
          {selectedResident.alerts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  お知らせ
                </CardTitle>
                <CardDescription>現在の状況についてのお知らせです</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedResident.alerts.map((alert, index) => (
                    <Alert key={index} className={alert.severity === "high" ? "border-red-200 bg-red-50" : ""}>
                      <AlertTriangle className={`h-4 w-4 ${alert.severity === "high" ? "text-red-500" : ""}`} />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={alert.severity === "high" ? "font-medium text-red-700" : ""}>{alert.message}</div>
                            <div className="text-sm text-gray-500 mt-1">{alert.received_at}</div>
                          </div>
                          <Badge variant={getAlertColor(alert.severity)}>
                            {alert.severity === "high" ? "緊急" : alert.severity === "medium" ? "注意" : "軽微"}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">すべて正常です</h3>
                  <p>
                    現在、特にお知らせすることはありません。{selectedResident.residentName}
                    さんは安全に過ごされています。
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 全体サマリー */}
          {familyData.linkedResidents.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>見守り対象全体の状況</CardTitle>
                <CardDescription>紐づけされている全ての高齢者の状況サマリー</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {familyData.linkedResidents.map((resident) => (
                    <div 
                      key={resident.residentId} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        resident.residentId === selectedResidentId 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedResidentId(resident.residentId)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{resident.residentName}</div>
                        <div className="flex items-center gap-1">
                          {resident.alerts.some(alert => alert.severity === "high") && (
                            <Badge variant="destructive" className="text-xs">緊急</Badge>
                          )}
                          {resident.alerts.some(alert => alert.severity === "medium") && (
                            <Badge variant="default" className="text-xs">注意</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div>{resident.homeId} - {resident.relationship}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span>{resident.temperature.toFixed(1)}°C</span>
                          <span>{resident.humidity}%</span>
                          <Badge variant={resident.doorStatus === "open" ? "default" : "secondary"} className="text-xs">
                            {resident.doorStatus === "open" ? "開" : "閉"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

            {/* 紐づく全ての家の状況（APIの実測値ベース） */}
            <Card>
                <CardHeader>
                    <CardTitle>各家の状況（実測）</CardTitle>
                    <CardDescription>/api/admin/sensor-readings より</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {familyData.linkedResidents.map((res) => {
                        const h = homesData.find(x => x.homeId === res.homeId);
                        return (
                        <div key={res.homeId} className="p-4 rounded-lg border bg-white">
                            <div className="flex items-center justify-between">
                            <div className="font-medium">{res.homeName}</div>
                            <Badge variant={h?.doorStatus === "open" ? "default" : "secondary"}>
                                玄関 {h?.doorStatus === "open" ? "開" : "閉"}
                            </Badge>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">{res.address}</div>

                            <div className="grid grid-cols-3 gap-3 mt-3">
                            <div className="text-center p-2 rounded bg-gray-50">
                                <div className="text-xs text-gray-500">温度</div>
                                <div className="text-lg font-bold">
                                {h ? `${h.temperature.toFixed(1)}°C` : "—"}
                                </div>
                            </div>
                            <div className="text-center p-2 rounded bg-gray-50">
                                <div className="text-xs text-gray-500">湿度</div>
                                <div className="text-lg font-bold">
                                {h ? `${h.humidity.toFixed(0)}%` : "—"}
                                </div>
                            </div>
                            <div className="text-center p-2 rounded bg-gray-50">
                                <div className="text-xs text-gray-500">最終活動</div>
                                <div className="text-sm font-medium truncate">
                                {h?.lastActivity ?? "—"}
                                </div>
                            </div>
                            </div>

                            {/* センサー簡易列挙 */}
                            <div className="mt-3 flex flex-wrap gap-2">
                            {(h?.sensors ?? []).map(s => (
                                <Badge
                                key={s.sensorId}
                                variant={s.status === "active" ? "default" : "secondary"}
                                className="text-xs"
                                title={`${s.sensorId} / lastSeen: ${s.lastSeen ?? "—"}`}
                                >
                                {s.type}
                                </Badge>
                            ))}
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </CardContent>
            </Card>

          {/* 最近の活動履歴 */}
          <Card>
            <CardHeader>
                <CardTitle>最近の活動履歴</CardTitle>
                <CardDescription>
                {selectedResident.residentName}さんの過去24時間の活動状況
                </CardDescription>
            </CardHeader>
            <CardContent>
                {(() => {
                // selectedHome（/api/admin/sensor-readings 由来）からイベント配列を優先使用
                const evts = (selectedHome?.recentEvents ?? []).slice(0, 50);

                // recentEvents が無ければフォールバックで簡易イベントを合成
                const fallback: Array<{
                    color: string; label: string; time: string;
                }> = [];

                if (!evts.length) {
                    // ドア
                    fallback.push({
                    color: "bg-green-500",
                    label: `玄関ドアが${selectedHome?.doorStatus === "open" ? "開" : "閉"}です`,
                    time: selectedHome?.lastActivity ?? "—",
                    });
                    // 温度
                    if (Number.isFinite(selectedHome?.temperature)) {
                    fallback.push({
                        color: "bg-blue-500",
                        label: `室温更新 (${selectedHome!.temperature.toFixed(1)}°C)`,
                        time: selectedHome?.lastActivity ?? "—",
                    });
                    }
                    // 湿度
                    if (Number.isFinite(selectedHome?.humidity)) {
                    fallback.push({
                        color: "bg-cyan-500",
                        label: `湿度更新 (${selectedHome!.humidity.toFixed(0)}%)`,
                        time: selectedHome?.lastActivity ?? "—",
                    });
                    }
                    // 各センサーの最終受信
                    (selectedHome?.sensors ?? []).forEach(s => {
                    fallback.push({
                        color: s.status === "active" ? "bg-purple-500" : "bg-gray-400",
                        label: `センサー ${s.sensorId}（${s.type}）から受信`,
                        time: s.lastSeen ?? "—",
                    });
                    });
                }

                // UI レンダリング
                if (evts.length) {
                    const colorByMetric: Record<string, string> = {
                    door: "bg-green-500",
                    temperature: "bg-blue-500",
                    humidity: "bg-cyan-500",
                    fall: "bg-red-500",
                    activity: "bg-purple-500",
                    };
                    return (
                    <div className="space-y-3">
                        {evts.map((e, i) => {
                        const dot = colorByMetric[e.metric] ?? "bg-gray-400";
                        const label =
                            e.note ??
                            (e.metric === "door"
                            ? `ドアの最終イベント: ${String(e.value ?? "").toLowerCase().includes("open") ? "開" : "閉"}`
                            : e.metric === "temperature"
                            ? `室温 ${Number.isFinite(Number(e.value)) ? Number(e.value).toFixed(1) + "°C" : ""}`
                            : e.metric === "humidity"
                            ? `湿度 ${Number.isFinite(Number(e.value)) ? Number(e.value).toFixed(0) + "%" : ""}`
                            : e.metric === "fall"
                            ? `転倒検知`
                            : `活動 (${e.metric})`);

                        return (
                            <div key={i} className="flex items-center justify-between py-2 border-b">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 ${dot} rounded-full`}></div>
                                <span>
                                {label}
                                {e.sensorId ? <span className="text-xs text-gray-500 ml-2">[{e.sensorId}]</span> : null}
                                </span>
                            </div>
                            <span className="text-sm text-gray-500">{e.received_at}</span>
                            </div>
                        );
                        })}
                    </div>
                    );
                }

                // フォールバック表示
                return (
                    <div className="space-y-3">
                    {fallback.map((f, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 ${f.color} rounded-full`}></div>
                            <span>{f.label}</span>
                        </div>
                        <span className="text-sm text-gray-500">{f.time}</span>
                        </div>
                    ))}
                    </div>
                );
                })()}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
