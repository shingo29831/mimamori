"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Users,
    Home,
    User,
    AlertTriangle,
    Search,
    LinkIcon,
    Thermometer,
    DoorOpen,
    Activity,
    Camera,
} from "lucide-react";
import { Link } from "react-router-dom";

interface FamilyUser {
    userId: string;
    userName: string;
    email: string;
    isActive: boolean;
    linkedResidents: Array<{
        residentId: string;
        residentName: string;
        homeId: string;
        homeName: string;
        relationship: string;
        linkedDate: string;
    }>;
}

interface Resident {
    residentId: string;
    residentName: string;
    homeId: string;
    homeName: string;
    address: string;
    dateOfBirth: string;
    linkedFamilies: Array<{
        userId: string;
        userName: string;
        relationship: string;
        linkedDate: string;
    }>;
}

interface SensorLink {
    sensorId: string;
    sensorName: string;
    sensorType: "MT10" | "MT20" | "MT30" | "MV23";
    serialNumber: string;
    homeId: string;
    homeName: string;
    roomName: string;
    linkedDate: string;
    status: "active" | "inactive";
}

interface HomeData {
    homeId: string;
    homeName: string;
    address: string;
}

interface NewFamilyLinkData {
    familyUserId: string;
    residentId: string;
    relationship: string;
}

interface NewSensorLinkData {
    sensorId: string;
    homeId: string;
    roomName: string;
}

interface NewResidentHomeLinkData {
    residentId: string;
    homeId: string;
    moveInDate: string;
}

export default function LinkManagementPage() {
    const [familyUsers, setFamilyUsers] = useState<FamilyUser[]>([]);
    const [residents, setResidents] = useState<Resident[]>([]);
    const [sensorLinks, setSensorLinks] = useState<SensorLink[]>([]);
    const [homes, setHomes] = useState<HomeData[]>([]);
    const [availableSensors, setAvailableSensors] = useState<
        Array<{
            sensorId: string;
            sensorName: string;
            sensorType: "MT10" | "MT20" | "MT30" | "MV23";
            serialNumber: string;
        }>
    >([]);

    // ダイアログ状態
    const [isFamilyLinkDialogOpen, setIsFamilyLinkDialogOpen] = useState(false);
    const [isSensorLinkDialogOpen, setIsSensorLinkDialogOpen] = useState(false);
    const [isResidentHomeLinkDialogOpen, setIsResidentHomeLinkDialogOpen] =
        useState(false);

    // フォームデータ
    const [newFamilyLinkData, setNewFamilyLinkData] =
        useState<NewFamilyLinkData>({
            familyUserId: "",
            residentId: "",
            relationship: "",
        });

    const [newSensorLinkData, setNewSensorLinkData] =
        useState<NewSensorLinkData>({
            sensorId: "",
            homeId: "",
            roomName: "",
        });

    const [newResidentHomeLinkData, setNewResidentHomeLinkData] =
        useState<NewResidentHomeLinkData>({
            residentId: "",
            homeId: "",
            moveInDate: new Date().toISOString().split("T")[0],
        });

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // モック家族ユーザーデータ
        const mockFamilyUsers: FamilyUser[] = [
            {
                userId: "family_001",
                userName: "田中 太郎",
                email: "tanaka@email.com",
                isActive: true,
                linkedResidents: [
                    {
                        residentId: "res_001",
                        residentName: "田中 花子",
                        homeId: "home_001",
                        homeName: "田中花子宅",
                        relationship: "息子",
                        linkedDate: "2024-01-01",
                    },
                ],
            },
            {
                userId: "family_002",
                userName: "佐藤 花子",
                email: "sato@email.com",
                isActive: true,
                linkedResidents: [
                    {
                        residentId: "res_002",
                        residentName: "佐藤 太郎",
                        homeId: "home_002",
                        homeName: "佐藤太郎宅",
                        relationship: "娘",
                        linkedDate: "2024-01-05",
                    },
                ],
            },
            {
                userId: "family_003",
                userName: "山田 美子",
                email: "yamada@email.com",
                isActive: true,
                linkedResidents: [
                    {
                        residentId: "res_003",
                        residentName: "山田 次郎",
                        homeId: "home_003",
                        homeName: "山田次郎宅",
                        relationship: "娘",
                        linkedDate: "2024-01-10",
                    },
                ],
            },
            {
                userId: "family_004",
                userName: "鈴木 一郎",
                email: "suzuki@email.com",
                isActive: false,
                linkedResidents: [],
            },
        ];

        // モック高齢者データ
        const mockResidents: Resident[] = [
            {
                residentId: "res_001",
                residentName: "田中 花子",
                homeId: "home_001",
                homeName: "田中花子宅",
                address: "東京都世田谷区桜丘1-1-1",
                dateOfBirth: "1935-03-15",
                linkedFamilies: [
                    {
                        userId: "family_001",
                        userName: "田中 太郎",
                        relationship: "息子",
                        linkedDate: "2024-01-01",
                    },
                ],
            },
            {
                residentId: "res_002",
                residentName: "佐藤 太郎",
                homeId: "home_002",
                homeName: "佐藤太郎宅",
                address: "東京都杉並区高円寺2-2-2",
                dateOfBirth: "1940-07-22",
                linkedFamilies: [
                    {
                        userId: "family_002",
                        userName: "佐藤 花子",
                        relationship: "娘",
                        linkedDate: "2024-01-05",
                    },
                ],
            },
            {
                residentId: "res_003",
                residentName: "山田 次郎",
                homeId: "home_003",
                homeName: "山田次郎宅",
                address: "東京都練馬区石神井3-3-3",
                dateOfBirth: "1938-11-08",
                linkedFamilies: [
                    {
                        userId: "family_003",
                        userName: "山田 美子",
                        relationship: "娘",
                        linkedDate: "2024-01-10",
                    },
                ],
            },
            {
                residentId: "res_004",
                residentName: "鈴木 美代子",
                homeId: "home_004",
                homeName: "鈴木美代子宅",
                address: "東京都中野区中野4-4-4",
                dateOfBirth: "1942-01-30",
                linkedFamilies: [],
            },
        ];

        // モックセンサー紐づけデータ
        const mockSensorLinks: SensorLink[] = [
            {
                sensorId: "MT10_001",
                sensorName: "田中宅リビング温湿度センサー",
                sensorType: "MT10",
                serialNumber: "SN001MT10001",
                homeId: "home_001",
                homeName: "田中花子宅",
                roomName: "リビング",
                linkedDate: "2024-01-01",
                status: "active",
            },
            {
                sensorId: "MT20_001",
                sensorName: "田中宅玄関ドアセンサー",
                sensorType: "MT20",
                serialNumber: "SN002MT20001",
                homeId: "home_001",
                homeName: "田中花子宅",
                roomName: "玄関",
                linkedDate: "2024-01-01",
                status: "active",
            },
            {
                sensorId: "MV23_001",
                sensorName: "田中宅リビングカメラセンサー",
                sensorType: "MV23",
                serialNumber: "SN004MV23001",
                homeId: "home_001",
                homeName: "田中花子宅",
                roomName: "リビング",
                linkedDate: "2024-01-01",
                status: "active",
            },
            {
                sensorId: "MT10_002",
                sensorName: "佐藤宅リビング温湿度センサー",
                sensorType: "MT10",
                serialNumber: "SN005MT10002",
                homeId: "home_002",
                homeName: "佐藤太郎宅",
                roomName: "リビング",
                linkedDate: "2024-01-05",
                status: "active",
            },
        ];

        // モック高齢者宅データ
        const mockHomes: HomeData[] = [
            {
                homeId: "home_001",
                homeName: "田中花子宅",
                address: "東京都世田谷区桜丘1-1-1",
            },
            {
                homeId: "home_002",
                homeName: "佐藤太郎宅",
                address: "東京都杉並区高円寺2-2-2",
            },
            {
                homeId: "home_003",
                homeName: "山田次郎宅",
                address: "東京都練馬区石神井3-3-3",
            },
            {
                homeId: "home_004",
                homeName: "鈴木美代子宅",
                address: "東京都中野区中野4-4-4",
            },
        ];

        // モック利用可能センサー（未配置）
        const mockAvailableSensors = [
            {
                sensorId: "MT10_004",
                sensorName: "未配置温湿度センサー1",
                sensorType: "MT10" as const,
                serialNumber: "SN011MT10004",
            },
            {
                sensorId: "MT20_004",
                sensorName: "未配置ドアセンサー1",
                sensorType: "MT20" as const,
                serialNumber: "SN012MT20004",
            },
            {
                sensorId: "MT30_004",
                sensorName: "未配置モーションセンサー1",
                sensorType: "MT30" as const,
                serialNumber: "SN013MT30004",
            },
        ];

        setFamilyUsers(mockFamilyUsers);
        setResidents(mockResidents);
        setSensorLinks(mockSensorLinks);
        setHomes(mockHomes);
        setAvailableSensors(mockAvailableSensors);
    }, []);

    const handleCreateFamilyLink = () => {
        if (
            !newFamilyLinkData.familyUserId ||
            !newFamilyLinkData.residentId ||
            !newFamilyLinkData.relationship
        ) {
            alert("すべての項目を入力してください");
            return;
        }

        console.log("新しい家族紐づけを作成:", newFamilyLinkData);
        alert("家族の紐づけが作成されました");

        setIsFamilyLinkDialogOpen(false);
        setNewFamilyLinkData({
            familyUserId: "",
            residentId: "",
            relationship: "",
        });
    };

    const handleCreateSensorLink = () => {
        if (
            !newSensorLinkData.sensorId ||
            !newSensorLinkData.homeId ||
            !newSensorLinkData.roomName
        ) {
            alert("すべての項目を入力してください");
            return;
        }

        console.log("新しいセンサー紐づけを作成:", newSensorLinkData);
        alert("センサーの紐づけが作成されました");

        setIsSensorLinkDialogOpen(false);
        setNewSensorLinkData({
            sensorId: "",
            homeId: "",
            roomName: "",
        });
    };

    const handleCreateResidentHomeLink = () => {
        if (
            !newResidentHomeLinkData.residentId ||
            !newResidentHomeLinkData.homeId ||
            !newResidentHomeLinkData.moveInDate
        ) {
            alert("すべての項目を入力してください");
            return;
        }

        console.log("新しい高齢者宅紐づけを作成:", newResidentHomeLinkData);
        alert("高齢者宅の紐づけが作成されました");

        setIsResidentHomeLinkDialogOpen(false);
        setNewResidentHomeLinkData({
            residentId: "",
            homeId: "",
            moveInDate: new Date().toISOString().split("T")[0],
        });
    };

    const handleDeleteLink = (type: string, id1: string, id2: string) => {
        if (confirm("この紐づけを削除してもよろしいですか？")) {
            console.log("紐づけを削除:", { type, id1, id2 });
            alert("紐づけが削除されました");
        }
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

    const getSensorTypeLabel = (type: string) => {
        switch (type) {
            case "MT10":
                return "温湿度センサー";
            case "MT20":
                return "ドア開閉センサー";
            case "MT30":
                return "モーションセンサー";
            case "MV23":
                return "転倒検知センサー";
            default:
                return "その他センサー";
        }
    };

    const filteredFamilyUsers = familyUsers.filter(
        (user) =>
            user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.linkedResidents.some((resident) =>
                resident.residentName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            )
    );

    const filteredResidents = residents.filter(
        (resident) =>
            resident.residentName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            resident.homeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resident.homeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSensorLinks = sensorLinks.filter(
        (sensor) =>
            sensor.sensorName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            sensor.sensorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sensor.homeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sensor.roomName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableFamilyUsers = familyUsers.filter((user) => user.isActive);
    const availableResidents = residents;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* 1段目：タイトル行（戻る＋タイトル＋説明） */}
                    <div className="flex items-center gap-3 py-4">
                        <Link to="/dashboard/staff" aria-label="戻る">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full border hover:bg-gray-50"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>

                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <LinkIcon className="h-6 w-6" />
                                <span className="truncate">紐づけ管理</span>
                            </h1>
                            <p className="text-gray-600 text-sm">
                                家族ユーザー、高齢者、センサーの紐づけ設定
                            </p>
                        </div>
                    </div>

                    {/* 2段目：パンくず（任意。要らなければ削除OK） */}
                    <nav className="pb-2 -mt-2 text-sm text-gray-500">
                        <Link
                            to="/dashboard/staff"
                            className="hover:text-gray-900"
                        >
                            管理機能
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 font-medium">
                            紐づけ管理
                        </span>
                    </nav>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 検索バー */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="家族名、メールアドレス、高齢者名、センサー名、宅IDで検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="family-view" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="family-view">
                            <Users className="h-4 w-4 mr-2" />
                            家族ユーザー別表示
                        </TabsTrigger>
                        <TabsTrigger value="resident-home-view">
                            <Home className="h-4 w-4 mr-2" />
                            高齢者宅紐づけ表示
                        </TabsTrigger>
                        <TabsTrigger value="sensor-view">
                            <Activity className="h-4 w-4 mr-2" />
                            センサー紐づけ表示
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="family-view" className="space-y-6">
                        <div className="flex justify-end">
                            <Dialog
                                open={isFamilyLinkDialogOpen}
                                onOpenChange={setIsFamilyLinkDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        新しい家族紐づけを追加
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>
                                            新しい家族紐づけの作成
                                        </DialogTitle>
                                        <DialogDescription>
                                            家族ユーザーと高齢者を紐づけて、見守り権限を設定します。
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="familyUser">
                                                家族ユーザー
                                            </Label>
                                            <Select
                                                value={
                                                    newFamilyLinkData.familyUserId
                                                }
                                                onValueChange={(value) =>
                                                    setNewFamilyLinkData({
                                                        ...newFamilyLinkData,
                                                        familyUserId: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="家族ユーザーを選択" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableFamilyUsers.map(
                                                        (user) => (
                                                            <SelectItem
                                                                key={
                                                                    user.userId
                                                                }
                                                                value={
                                                                    user.userId
                                                                }
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4" />
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {
                                                                                user.userName
                                                                            }
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {
                                                                                user.email
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="resident">
                                                高齢者
                                            </Label>
                                            <Select
                                                value={
                                                    newFamilyLinkData.residentId
                                                }
                                                onValueChange={(value) =>
                                                    setNewFamilyLinkData({
                                                        ...newFamilyLinkData,
                                                        residentId: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="高齢者を選択" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableResidents.map(
                                                        (resident) => (
                                                            <SelectItem
                                                                key={
                                                                    resident.residentId
                                                                }
                                                                value={
                                                                    resident.residentId
                                                                }
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Home className="h-4 w-4" />
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {
                                                                                resident.residentName
                                                                            }
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {
                                                                                resident.homeId
                                                                            }{" "}
                                                                            -{" "}
                                                                            {
                                                                                resident.homeName
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="relationship">
                                                関係性
                                            </Label>
                                            <Select
                                                value={
                                                    newFamilyLinkData.relationship
                                                }
                                                onValueChange={(value) =>
                                                    setNewFamilyLinkData({
                                                        ...newFamilyLinkData,
                                                        relationship: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="関係性を選択" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="息子">
                                                        息子
                                                    </SelectItem>
                                                    <SelectItem value="娘">
                                                        娘
                                                    </SelectItem>
                                                    <SelectItem value="配偶者">
                                                        配偶者
                                                    </SelectItem>
                                                    <SelectItem value="孫">
                                                        孫
                                                    </SelectItem>
                                                    <SelectItem value="兄弟姉妹">
                                                        兄弟姉妹
                                                    </SelectItem>
                                                    <SelectItem value="その他親族">
                                                        その他親族
                                                    </SelectItem>
                                                    <SelectItem value="友人">
                                                        友人
                                                    </SelectItem>
                                                    <SelectItem value="その他">
                                                        その他
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setIsFamilyLinkDialogOpen(false)
                                            }
                                        >
                                            キャンセル
                                        </Button>
                                        <Button
                                            onClick={handleCreateFamilyLink}
                                        >
                                            紐づけを作成
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {filteredFamilyUsers.map((familyUser) => (
                                <Card key={familyUser.userId}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <User className="h-5 w-5" />
                                                    {familyUser.userName}
                                                </CardTitle>
                                                <CardDescription>
                                                    <div className="space-y-1">
                                                        <div>
                                                            ユーザーID:{" "}
                                                            {familyUser.userId}
                                                        </div>
                                                        <div>
                                                            メール:{" "}
                                                            {familyUser.email}
                                                        </div>
                                                    </div>
                                                </CardDescription>
                                            </div>
                                            <Badge
                                                variant={
                                                    familyUser.isActive
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {familyUser.isActive
                                                    ? "有効"
                                                    : "無効"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {familyUser.linkedResidents.length >
                                        0 ? (
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-sm text-gray-700">
                                                    紐づけされた高齢者
                                                </h4>
                                                {familyUser.linkedResidents.map(
                                                    (resident) => (
                                                        <div
                                                            key={
                                                                resident.residentId
                                                            }
                                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Home className="h-4 w-4 text-gray-500" />
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {
                                                                            resident.residentName
                                                                        }
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        宅ID:{" "}
                                                                        {
                                                                            resident.homeId
                                                                        }{" "}
                                                                        -{" "}
                                                                        {
                                                                            resident.homeName
                                                                        }
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        関係:{" "}
                                                                        {
                                                                            resident.relationship
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">
                                                                    {
                                                                        resident.linkedDate
                                                                    }
                                                                </Badge>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleDeleteLink(
                                                                            "family",
                                                                            familyUser.userId,
                                                                            resident.residentId
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <Alert>
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>
                                                    このユーザーは高齢者と紐づけされていません。
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="resident-home-view"
                        className="space-y-6"
                    >
                        <div className="flex justify-end">
                            <Dialog
                                open={isResidentHomeLinkDialogOpen}
                                onOpenChange={setIsResidentHomeLinkDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        新しい高齢者宅紐づけを追加
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>
                                            新しい高齢者宅紐づけの作成
                                        </DialogTitle>
                                        <DialogDescription>
                                            高齢者を高齢者宅に紐づけて、居住関係を設定します。
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="resident">
                                                高齢者
                                            </Label>
                                            <Select
                                                value={
                                                    newResidentHomeLinkData.residentId
                                                }
                                                onValueChange={(value) =>
                                                    setNewResidentHomeLinkData({
                                                        ...newResidentHomeLinkData,
                                                        residentId: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="高齢者を選択" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableResidents.map(
                                                        (resident) => (
                                                            <SelectItem
                                                                key={
                                                                    resident.residentId
                                                                }
                                                                value={
                                                                    resident.residentId
                                                                }
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4" />
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {
                                                                                resident.residentName
                                                                            }
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            生年月日:{" "}
                                                                            {
                                                                                resident.dateOfBirth
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="home">
                                                高齢者宅
                                            </Label>
                                            <Select
                                                value={
                                                    newResidentHomeLinkData.homeId
                                                }
                                                onValueChange={(value) =>
                                                    setNewResidentHomeLinkData({
                                                        ...newResidentHomeLinkData,
                                                        homeId: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="高齢者宅を選択" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {homes.map((home) => (
                                                        <SelectItem
                                                            key={home.homeId}
                                                            value={home.homeId}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Home className="h-4 w-4" />
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {
                                                                            home.homeName
                                                                        }
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {
                                                                            home.address
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="moveInDate">
                                                入居日
                                            </Label>
                                            <Input
                                                type="date"
                                                value={
                                                    newResidentHomeLinkData.moveInDate
                                                }
                                                onChange={(e) =>
                                                    setNewResidentHomeLinkData({
                                                        ...newResidentHomeLinkData,
                                                        moveInDate:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setIsResidentHomeLinkDialogOpen(
                                                    false
                                                )
                                            }
                                        >
                                            キャンセル
                                        </Button>
                                        <Button
                                            onClick={
                                                handleCreateResidentHomeLink
                                            }
                                        >
                                            紐づけを作成
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {homes.map((home) => {
                                const residentsInHome = residents.filter(
                                    (resident) =>
                                        resident.homeId === home.homeId
                                );
                                return (
                                    <Card key={home.homeId}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Home className="h-5 w-5" />
                                                        {home.homeName}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        <div className="space-y-1">
                                                            <div>
                                                                宅ID:{" "}
                                                                {home.homeId}
                                                            </div>
                                                            <div>
                                                                住所:{" "}
                                                                {home.address}
                                                            </div>
                                                        </div>
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="outline">
                                                    {residentsInHome.length}
                                                    名居住
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {residentsInHome.length > 0 ? (
                                                <div className="space-y-3">
                                                    <h4 className="font-medium text-sm text-gray-700">
                                                        居住中の高齢者
                                                    </h4>
                                                    {residentsInHome.map(
                                                        (resident) => (
                                                            <div
                                                                key={
                                                                    resident.residentId
                                                                }
                                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <User className="h-4 w-4 text-gray-500" />
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {
                                                                                resident.residentName
                                                                            }
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            高齢者ID:{" "}
                                                                            {
                                                                                resident.residentId
                                                                            }
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            生年月日:{" "}
                                                                            {
                                                                                resident.dateOfBirth
                                                                            }
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            家族:{" "}
                                                                            {
                                                                                resident
                                                                                    .linkedFamilies
                                                                                    .length
                                                                            }
                                                                            名
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleDeleteLink(
                                                                                "resident-home",
                                                                                resident.residentId,
                                                                                home.homeId
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <Alert>
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        この高齢者宅には居住者が登録されていません。
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="sensor-view" className="space-y-6">
                        <div className="flex justify-end">
                            <Dialog
                                open={isSensorLinkDialogOpen}
                                onOpenChange={setIsSensorLinkDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        新しいセンサー紐づけを追加
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>
                                            新しいセンサー紐づけの作成
                                        </DialogTitle>
                                        <DialogDescription>
                                            センサーを高齢者宅に配置して、監視システムを設定します。
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sensor">
                                                センサー
                                            </Label>
                                            <Select
                                                value={
                                                    newSensorLinkData.sensorId
                                                }
                                                onValueChange={(value) =>
                                                    setNewSensorLinkData({
                                                        ...newSensorLinkData,
                                                        sensorId: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="センサーを選択" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableSensors.map(
                                                        (sensor) => (
                                                            <SelectItem
                                                                key={
                                                                    sensor.sensorId
                                                                }
                                                                value={
                                                                    sensor.sensorId
                                                                }
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {getSensorIcon(
                                                                        sensor.sensorType
                                                                    )}
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {
                                                                                sensor.sensorName
                                                                            }
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {getSensorTypeLabel(
                                                                                sensor.sensorType
                                                                            )}{" "}
                                                                            -{" "}
                                                                            {
                                                                                sensor.serialNumber
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="home">
                                                高齢者宅
                                            </Label>
                                            <Select
                                                value={newSensorLinkData.homeId}
                                                onValueChange={(value) =>
                                                    setNewSensorLinkData({
                                                        ...newSensorLinkData,
                                                        homeId: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="高齢者宅を選択" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {homes.map((home) => (
                                                        <SelectItem
                                                            key={home.homeId}
                                                            value={home.homeId}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Home className="h-4 w-4" />
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {
                                                                            home.homeName
                                                                        }
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {
                                                                            home.address
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="room">
                                                設置部屋
                                            </Label>
                                            <Input
                                                value={
                                                    newSensorLinkData.roomName
                                                }
                                                onChange={(e) =>
                                                    setNewSensorLinkData({
                                                        ...newSensorLinkData,
                                                        roomName:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="例: リビング、玄関、寝室"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setIsSensorLinkDialogOpen(false)
                                            }
                                        >
                                            キャンセル
                                        </Button>
                                        <Button
                                            onClick={handleCreateSensorLink}
                                        >
                                            紐づけを作成
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {filteredSensorLinks.map((sensor) => (
                                <Card key={sensor.sensorId}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    {getSensorIcon(
                                                        sensor.sensorType
                                                    )}
                                                    {sensor.sensorName}
                                                </CardTitle>
                                                <CardDescription>
                                                    <div className="space-y-1">
                                                        <div>
                                                            センサーID:{" "}
                                                            {sensor.sensorId}
                                                        </div>
                                                        <div>
                                                            シリアル番号:{" "}
                                                            {
                                                                sensor.serialNumber
                                                            }
                                                        </div>
                                                        <div>
                                                            種別:{" "}
                                                            {getSensorTypeLabel(
                                                                sensor.sensorType
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardDescription>
                                            </div>
                                            <Badge
                                                variant={
                                                    sensor.status === "active"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {sensor.status === "active"
                                                    ? "稼働中"
                                                    : "停止"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-sm text-gray-700">
                                                配置情報
                                            </h4>
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Home className="h-4 w-4 text-gray-500" />
                                                    <div>
                                                        <div className="font-medium">
                                                            {sensor.homeName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            宅ID:{" "}
                                                            {sensor.homeId}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            設置部屋:{" "}
                                                            {sensor.roomName}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">
                                                        {sensor.linkedDate}
                                                    </Badge>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDeleteLink(
                                                                "sensor",
                                                                sensor.sensorId,
                                                                sensor.homeId
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
