"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Thermometer,
    Droplets,
    DoorOpen,
    AlertTriangle,
    Home,
    Activity,
    Bell,
    Settings,
    Eye,
    Wifi,
    Camera,
    LinkIcon,
    Plus,
    Database,
} from "lucide-react";
import { Link } from "react-router-dom";

interface HomeStatus {
    homeId: string;
    homeName: string;
    residentName: string;
    address: string;
    temperature: number;
    humidity: number;
    doorStatus: "open" | "closed";
    lastActivity: string;
    fallDetected: boolean;
    alerts: Array<{
        type: "fall" | "temperature" | "humidity" | "door" | "emergency";
        message: string;
        timestamp: string;
        severity: "high" | "medium" | "low";
    }>;
    sensors: Array<{
        sensorId: string;
        type: "MT10" | "MT20" | "MT30" | "MV23";
        status: "active" | "inactive";
        lastSeen: string;
    }>;
}

export default function StaffDashboard() {
    const [homes, setHomes] = useState<HomeStatus[]>([]);
    const [activeAlerts, setActiveAlerts] = useState(0);
    const [wsConnected, setWsConnected] = useState(false);

    useEffect(() => {
        // モックデータの初期化
        const mockHomes: HomeStatus[] = [
            {
                homeId: "home_001",
                homeName: "田中花子宅",
                residentName: "田中 花子",
                address: "東京都世田谷区桜丘1-1-1",
                temperature: 24.5,
                humidity: 55,
                doorStatus: "closed",
                lastActivity: "5分前",
                fallDetected: false,
                alerts: [],
                sensors: [
                    {
                        sensorId: "MT10_001",
                        type: "MT10",
                        status: "active",
                        lastSeen: "1分前",
                    },
                    {
                        sensorId: "MT20_001",
                        type: "MT20",
                        status: "active",
                        lastSeen: "30秒前",
                    },
                    {
                        sensorId: "MT30_001",
                        type: "MT30",
                        status: "active",
                        lastSeen: "2分前",
                    },
                    {
                        sensorId: "MV23_001",
                        type: "MV23",
                        status: "active",
                        lastSeen: "15秒前",
                    },
                ],
            },
            {
                homeId: "home_002",
                homeName: "佐藤太郎宅",
                residentName: "佐藤 太郎",
                address: "東京都杉並区高円寺2-2-2",
                temperature: 26.8,
                humidity: 62,
                doorStatus: "open",
                lastActivity: "2分前",
                fallDetected: false,
                alerts: [
                    {
                        type: "temperature",
                        message: "室温が設定値を超えています (26.8°C)",
                        timestamp: "2分前",
                        severity: "medium",
                    },
                ],
                sensors: [
                    {
                        sensorId: "MT10_002",
                        type: "MT10",
                        status: "active",
                        lastSeen: "1分前",
                    },
                    {
                        sensorId: "MT20_002",
                        type: "MT20",
                        status: "active",
                        lastSeen: "30秒前",
                    },
                    {
                        sensorId: "MT30_002",
                        type: "MT30",
                        status: "active",
                        lastSeen: "1分前",
                    },
                    {
                        sensorId: "MV23_002",
                        type: "MV23",
                        status: "active",
                        lastSeen: "20秒前",
                    },
                ],
            },
            {
                homeId: "home_003",
                homeName: "山田次郎宅",
                residentName: "山田 次郎",
                address: "東京都練馬区石神井3-3-3",
                temperature: 23.2,
                humidity: 48,
                doorStatus: "closed",
                lastActivity: "1時間前",
                fallDetected: true,
                alerts: [
                    {
                        type: "fall",
                        message: "転倒の可能性が検知されました（10秒以上継続）",
                        timestamp: "30分前",
                        severity: "high",
                    },
                ],
                sensors: [
                    {
                        sensorId: "MT10_003",
                        type: "MT10",
                        status: "active",
                        lastSeen: "1分前",
                    },
                    {
                        sensorId: "MT20_003",
                        type: "MT20",
                        status: "active",
                        lastSeen: "30秒前",
                    },
                    {
                        sensorId: "MT30_003",
                        type: "MT30",
                        status: "active",
                        lastSeen: "3分前",
                    },
                    {
                        sensorId: "MV23_003",
                        type: "MV23",
                        status: "active",
                        lastSeen: "10秒前",
                    },
                ],
            },
        ];

        setHomes(mockHomes);
        setActiveAlerts(
            mockHomes.reduce((acc, home) => acc + home.alerts.length, 0)
        );

        // WebSocket接続のシミュレーション
        setWsConnected(true);

        // 10秒ごとのデータ更新（WebSocketシミュレーション）
        const interval = setInterval(() => {
            setHomes((prevHomes) =>
                prevHomes.map((home) => ({
                    ...home,
                    temperature: home.temperature + (Math.random() - 0.5) * 0.5,
                    humidity: home.humidity + (Math.random() - 0.5) * 2,
                    // 転倒検知の誤検知対策：10秒以上継続した場合のみアラート
                    fallDetected:
                        Math.random() > 0.98 ? true : home.fallDetected,
                }))
            );
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const getAlertColor = (severity: string) => {
        switch (severity) {
            case "high":
                return "destructive";
            case "medium":
                return "default";
            case "low":
                return "secondary";
            default:
                return "default";
        }
    };

    const getTempColor = (temp: number) => {
        if (temp > 26) return "text-red-600";
        if (temp < 18) return "text-blue-600";
        return "text-green-600";
    };

    const getSensorIcon = (type: string) => {
        switch (type) {
            case "MT10":
                return <Thermometer className="h-4 w-4" />;
            case "MT20":
                return <DoorOpen className="h-4 w-4" />;
            case "MT30":
                return <Activity className="h-4 w-4" />;
            case "MV23":
                return <Camera className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                職員ダッシュボード
                            </h1>
                            <p className="text-gray-600">
                                高齢者宅見守りシステム
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Wifi
                                    className={`h-4 w-4 ${
                                        wsConnected
                                            ? "text-green-500"
                                            : "text-red-500"
                                    }`}
                                />
                                <span className="text-sm text-gray-600">
                                    {wsConnected
                                        ? "リアルタイム接続中"
                                        : "接続エラー"}
                                </span>
                            </div>
                            <Button variant="outline" size="sm">
                                <Bell className="h-4 w-4 mr-2" />
                                アラート ({activeAlerts})
                            </Button>
                            <Link to="/profile">
                                <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4 mr-2" />
                                    設定
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">
                            総合ダッシュボード
                        </TabsTrigger>
                        <TabsTrigger value="alerts">
                            アラートセンター
                        </TabsTrigger>
                        <TabsTrigger value="management">管理機能</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* サマリーカード */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        監視対象宅数
                                    </CardTitle>
                                    <Home className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {homes.length}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        高齢者宅監視中
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        アクティブアラート
                                    </CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">
                                        {activeAlerts}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        要対応
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        平均室温
                                    </CardTitle>
                                    <Thermometer className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {(
                                            homes.reduce(
                                                (acc, home) =>
                                                    acc + home.temperature,
                                                0
                                            ) / homes.length
                                        ).toFixed(1)}
                                        °C
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        全宅平均
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        システム状態
                                    </CardTitle>
                                    <Activity className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        正常
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        全センサー稼働中
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 高齢者宅状況グリッド */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {homes.map((home) => (
                                <Card key={home.homeId} className="relative">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {home.homeName}
                                                </CardTitle>
                                                <CardDescription>
                                                    {home.residentName}
                                                </CardDescription>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {home.address}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/home/${home.homeId}`}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* センサーデータ */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2">
                                                <Thermometer className="h-4 w-4 text-gray-500" />
                                                <span
                                                    className={`font-medium ${getTempColor(
                                                        home.temperature
                                                    )}`}
                                                >
                                                    {home.temperature.toFixed(
                                                        1
                                                    )}
                                                    °C
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Droplets className="h-4 w-4 text-blue-500" />
                                                <span className="font-medium">
                                                    {home.humidity.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <DoorOpen className="h-4 w-4 text-gray-500" />
                                                <Badge
                                                    variant={
                                                        home.doorStatus ===
                                                        "open"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {home.doorStatus === "open"
                                                        ? "開"
                                                        : "閉"}
                                                </Badge>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                最終活動: {home.lastActivity}
                                            </span>
                                        </div>

                                        {/* 転倒検知状態 */}
                                        {home.fallDetected && (
                                            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                                <span className="text-sm font-medium text-red-700">
                                                    転倒検知中
                                                </span>
                                            </div>
                                        )}

                                        {/* センサー状態 */}
                                        <div className="flex gap-1">
                                            {home.sensors.map((sensor) => (
                                                <div
                                                    key={sensor.sensorId}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                                        sensor.status ===
                                                        "active"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {getSensorIcon(sensor.type)}
                                                    <span>{sensor.type}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* アラート */}
                                        {home.alerts.length > 0 && (
                                            <div className="space-y-2">
                                                {home.alerts.map(
                                                    (alert, index) => (
                                                        <Alert
                                                            key={index}
                                                            className="py-2"
                                                        >
                                                            <AlertTriangle className="h-4 w-4" />
                                                            <AlertDescription className="text-sm">
                                                                <div className="flex justify-between items-center">
                                                                    <span>
                                                                        {
                                                                            alert.message
                                                                        }
                                                                    </span>
                                                                    <Badge
                                                                        variant={getAlertColor(
                                                                            alert.severity
                                                                        )}
                                                                    >
                                                                        {alert.severity ===
                                                                        "high"
                                                                            ? "緊急"
                                                                            : alert.severity ===
                                                                              "medium"
                                                                            ? "注意"
                                                                            : "軽微"}
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {
                                                                        alert.timestamp
                                                                    }
                                                                </div>
                                                            </AlertDescription>
                                                        </Alert>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="alerts">
                        <Card>
                            <CardHeader>
                                <CardTitle>アラートセンター</CardTitle>
                                <CardDescription>
                                    発生中のアラートと通知履歴
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {homes.flatMap((home) =>
                                        home.alerts.map((alert, index) => (
                                            <Alert
                                                key={`${home.homeId}-${index}`}
                                            >
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-medium">
                                                                {home.homeName}{" "}
                                                                -{" "}
                                                                {
                                                                    home.residentName
                                                                }
                                                            </div>
                                                            <div>
                                                                {alert.message}
                                                            </div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {
                                                                    alert.timestamp
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Badge
                                                                variant={getAlertColor(
                                                                    alert.severity
                                                                )}
                                                            >
                                                                {alert.severity ===
                                                                "high"
                                                                    ? "緊急"
                                                                    : alert.severity ===
                                                                      "medium"
                                                                    ? "注意"
                                                                    : "軽微"}
                                                            </Badge>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                            >
                                                                対応済み
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="management">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>システム管理</CardTitle>
                                    <CardDescription>
                                        データ管理と紐づけ設定の統合管理
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Link to="/management/system-management">
                                            <Button className="w-full">
                                                <Database className="h-4 w-4 mr-2" />
                                                システム管理画面を開く
                                            </Button>
                                        </Link>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>
                                                    紐づけ管理（高齢者-宅、センサー-宅、利用者-高齢者）
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>
                                                    一覧・登録（利用者、高齢者、高齢者宅、センサー）
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span>未登録センサー管理</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                <span>絞り込み・検索機能</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>紐づけ管理</CardTitle>
                                    <CardDescription>
                                        家族ユーザー、高齢者、センサーの紐づけ設定
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Link to="/management/family-links">
                                            <Button className="w-full">
                                                <LinkIcon className="h-4 w-4 mr-2" />
                                                紐づけ管理画面を開く
                                            </Button>
                                        </Link>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        家族ユーザー紐づけ
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        家族ユーザーと高齢者の関係設定
                                                    </div>
                                                </div>
                                                <Badge variant="outline">
                                                    3件
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">
                                                        センサー紐づけ
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        センサーと高齢者宅の配置設定
                                                    </div>
                                                </div>
                                                <Badge variant="outline">
                                                    4件
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
