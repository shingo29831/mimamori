"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Thermometer, Droplets, DoorOpen, AlertTriangle, Heart, Clock, Wifi, Home, User, ChevronDown } from 'lucide-react'

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
    timestamp: string
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

  useEffect(() => {
    // 家族ユーザーに紐づけられた複数の高齢者のモックデータ
    const mockFamilyData: FamilyUserData = {
      userId: "family_001",
      userName: "田中 太郎",
      email: "tanaka@email.com",
      linkedResidents: [
        {
          residentId: "res_001",
          residentName: "田中 花子",
          homeId: "home_001",
          homeName: "田中花子宅",
          address: "東京都世田谷区桜丘1-1-1",
          temperature: 24.5,
          humidity: 55,
          doorStatus: "closed",
          lastActivity: "5分前",
          relationship: "母",
          fallDetected: false,
          alerts: [],
        },
        {
          residentId: "res_005",
          residentName: "田中 一郎",
          homeId: "home_005",
          homeName: "田中一郎宅",
          address: "東京都世田谷区桜丘2-2-2",
          temperature: 26.2,
          humidity: 58,
          doorStatus: "open",
          lastActivity: "10分前",
          relationship: "父",
          fallDetected: false,
          alerts: [
            {
              type: "temperature",
              message: "室温がやや高めです (26.2°C)",
              timestamp: "5分前",
              severity: "medium",
            },
          ],
        },
        {
          residentId: "res_006",
          residentName: "田中 祖母",
          homeId: "home_006",
          homeName: "田中祖母宅",
          address: "東京都世田谷区桜丘3-3-3",
          temperature: 23.8,
          humidity: 52,
          doorStatus: "closed",
          lastActivity: "2時間前",
          relationship: "祖母",
          fallDetected: true,
          alerts: [
            {
              type: "fall",
              message: "転倒の可能性が検知されました（10秒以上継続）",
              timestamp: "1時間前",
              severity: "high",
            },
            {
              type: "activity",
              message: "長時間活動が検知されていません",
              timestamp: "2時間前",
              severity: "medium",
            },
          ],
        },
      ],
    }

    setFamilyData(mockFamilyData)
    
    // 最初の高齢者を選択状態にする
    if (mockFamilyData.linkedResidents.length > 0) {
      setSelectedResidentId(mockFamilyData.linkedResidents[0].residentId)
    }
    
    setWsConnected(true)

    // WebSocketによるリアルタイム更新のシミュレーション（10秒ごと）
    const interval = setInterval(() => {
      setFamilyData((prev) =>
        prev
          ? {
              ...prev,
              linkedResidents: prev.linkedResidents.map((resident) => ({
                ...resident,
                temperature: resident.temperature + (Math.random() - 0.5) * 0.5,
                humidity: resident.humidity + (Math.random() - 0.5) * 2,
                // 転倒検知の誤検知対策：10秒以上継続した場合のみアラート
                fallDetected: Math.random() > 0.99 ? true : resident.fallDetected,
              })),
            }
          : null,
      )
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (!familyData) {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    <div className="flex items-center gap-2 mt-1">
                      <Home className="h-4 w-4" />
                      {selectedResident.homeName}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">宅ID: {selectedResident.homeId}</div>
                    <div className="text-sm text-gray-500">{selectedResident.address}</div>
                    <div className="text-sm mt-1">あなたとの関係: {selectedResident.relationship}</div>
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
                            <div className="text-sm text-gray-500 mt-1">{alert.timestamp}</div>
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

          {/* 最近の活動履歴 */}
          <Card>
            <CardHeader>
              <CardTitle>最近の活動履歴</CardTitle>
              <CardDescription>{selectedResident.residentName}さんの過去24時間の活動状況</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>玄関ドアが開かれました</span>
                  </div>
                  <span className="text-sm text-gray-500">{selectedResident.lastActivity}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>室温が変化しました ({selectedResident.temperature.toFixed(1)}°C)</span>
                  </div>
                  <span className="text-sm text-gray-500">1時間前</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>玄関ドアが閉じられました</span>
                  </div>
                  <span className="text-sm text-gray-500">2時間前</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>リビングで活動を検知</span>
                  </div>
                  <span className="text-sm text-gray-500">3時間前</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
