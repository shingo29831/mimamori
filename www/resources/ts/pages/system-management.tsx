"use client";

import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom"; // ← 別名に変更

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    UserCheck,
    Search,
    Link as LinkIcon,
    Settings,
    CameraIcon as Sensor,
} from "lucide-react";

interface User {
    userId: string;
    userName: string;
    email: string;
    role: string;
    createdAt: string;
}
interface Resident {
    residentId: string;
    residentName: string;
    birthDate: string;
    age: number;
    createdAt: string;
}
interface HomeData {
    homeId: string;
    homeName: string;
    address: string;
    sensorCount: number;
    createdAt: string;
}
interface SensorData {
    sensorId: string;
    sensorName: string;
    sensorType: string;
    homeId?: string;
    homeName?: string;
    roomName?: string;
    status: string;
    lastActive: string;
}
interface Relationship {
    id: string;
    type: string;
    fromName: string;
    toName: string;
    relationship?: string;
    roomName?: string;
    createdAt: string;
}

const Page = () => {
    const navigate = useNavigate(); // ← useRouter の代わり

    const [activeTab, setActiveTab] = useState("users");
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [users, setUsers] = useState<User[]>([]);
    const [residents, setResidents] = useState<Resident[]>([]);
    const [homes, setHomes] = useState<HomeData[]>([]);
    const [sensors, setSensors] = useState<SensorData[]>([]);
    const [unregisteredSensors, setUnregisteredSensors] = useState<
        SensorData[]
    >([]);
    const [relationships, setRelationships] = useState<Relationship[]>([]);

    const [newUser, setNewUser] = useState({
        userName: "",
        email: "",
        role: "family",
    });
    const [newResident, setNewResident] = useState({
        residentName: "",
        birthDate: "",
    });
    const [newHome, setNewHome] = useState({ homeName: "", address: "" });
    const [newSensor, setNewSensor] = useState({
        sensorName: "",
        sensorType: "",
        homeId: "",
        roomName: "",
    });

    const [newGuardianLink, setNewGuardianLink] = useState({
        userId: "",
        residentId: "",
        relationship: "",
    });
    const [newResidentHomeLink, setNewResidentHomeLink] = useState({
        residentId: "",
        homeId: "",
    });
    const [newSensorHomeLink, setNewSensorHomeLink] = useState({
        sensorId: "",
        homeId: "",
        roomName: "",
    });

    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [isResidentDialogOpen, setIsResidentDialogOpen] = useState(false);
    const [isHomeDialogOpen, setIsHomeDialogOpen] = useState(false);
    const [isSensorDialogOpen, setIsSensorDialogOpen] = useState(false);

    const showMessage = (message: string, isError = false) => {
        console.log(isError ? `Error: ${message}` : message);
    };

    const loadUsers = async () => {
        try {
            const response = await fetch("/api/admin/users");
            const data = await response.json();
            if (data.success) setUsers(data.users);
        } catch (e) {
            console.error("利用者データの読み込みエラー:", e);
        }
    };
    const loadResidents = async () => {
        try {
            const response = await fetch("/api/admin/residents");
            const data = await response.json();
            if (data.success) setResidents(data.residents);
        } catch (e) {
            console.error("高齢者データの読み込みエラー:", e);
        }
    };
    const loadHomes = async () => {
        try {
            const response = await fetch("/api/admin/homes");
            const data = await response.json();
            if (data.success) setHomes(data.homes);
        } catch (e) {
            console.error("高齢者宅データの読み込みエラー:", e);
        }
    };
    const loadSensors = async () => {
        try {
            const response = await fetch("/api/admin/sensors");
            const data = await response.json();
            if (data.success) {
                setSensors(data.sensors.filter((s: SensorData) => s.homeId));
                setUnregisteredSensors(
                    data.sensors.filter((s: SensorData) => !s.homeId)
                );
            }
        } catch (e) {
            console.error("センサーデータの読み込みエラー:", e);
        }
    };
    const loadRelationships = async () => {
        try {
            const response = await fetch("/api/admin/relationships");
            const data = await response.json();
            if (data.success) setRelationships(data.relationships);
        } catch (e) {
            console.error("紐付けデータの読み込みエラー:", e);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.userName || !newUser.email) {
            showMessage("氏名とメールアドレスを入力してください", true);
            return;
        }
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });
            const data = await res.json();
            if (data.success) {
                setNewUser({ userName: "", email: "", role: "family" });
                setIsUserDialogOpen(false);
                await loadUsers();
                showMessage("利用者を登録しました");
            } else {
                showMessage(data.message || "利用者の登録に失敗しました", true);
            }
        } catch (e) {
            console.error("利用者登録エラー:", e);
            showMessage("利用者の登録に失敗しました", true);
        }
    };

    const handleCreateResident = async () => {
        if (!newResident.residentName || !newResident.birthDate) {
            showMessage("氏名と生年月日を入力してください", true);
            return;
        }
        try {
            const res = await fetch("/api/admin/residents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newResident),
            });
            const data = await res.json();
            if (data.success) {
                setNewResident({ residentName: "", birthDate: "" });
                setIsResidentDialogOpen(false);
                await loadResidents();
                showMessage("高齢者を登録しました");
            } else {
                showMessage(data.message || "高齢者の登録に失敗しました", true);
            }
        } catch (e) {
            console.error("高齢者登録エラー:", e);
            showMessage("高齢者の登録に失敗しました", true);
        }
    };

    const handleCreateHome = async () => {
        if (!newHome.homeName || !newHome.address) {
            showMessage("宅名と住所を入力してください", true);
            return;
        }
        try {
            const res = await fetch("/api/admin/homes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newHome),
            });
            const data = await res.json();
            if (data.success) {
                setNewHome({ homeName: "", address: "" });
                setIsHomeDialogOpen(false);
                await loadHomes();
                showMessage("高齢者宅を登録しました");
            } else {
                showMessage(
                    data.message || "高齢者宅の登録に失敗しました",
                    true
                );
            }
        } catch (e) {
            console.error("高齢者宅登録エラー:", e);
            showMessage("高齢者宅の登録に失敗しました", true);
        }
    };

    const handleCreateSensor = async () => {
        if (
            !newSensor.sensorName ||
            !newSensor.sensorType ||
            !newSensor.homeId
        ) {
            showMessage("すべての項目を入力してください", true);
            return;
        }
        try {
            const res = await fetch("/api/admin/sensors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSensor),
            });
            const data = await res.json();
            if (data.success) {
                setNewSensor({
                    sensorName: "",
                    sensorType: "",
                    homeId: "",
                    roomName: "",
                });
                setIsSensorDialogOpen(false);
                await loadSensors();
                showMessage("センサーを登録しました");
            } else {
                showMessage(
                    data.message || "センサーの登録に失敗しました",
                    true
                );
            }
        } catch (e) {
            console.error("センサー登録エラー:", e);
            showMessage("センサーの登録に失敗しました", true);
        }
    };

    const handleCreateGuardianLink = async () => {
        if (
            !newGuardianLink.userId ||
            !newGuardianLink.residentId ||
            !newGuardianLink.relationship
        ) {
            showMessage("すべての項目を選択してください", true);
            return;
        }
        try {
            const res = await fetch("/api/admin/relationships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "user-resident",
                    ...newGuardianLink,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setNewGuardianLink({
                    userId: "",
                    residentId: "",
                    relationship: "",
                });
                await loadRelationships();
                showMessage("利用者と高齢者を紐づけました");
            } else {
                showMessage(data.message || "紐付けに失敗しました", true);
            }
        } catch (e) {
            console.error("紐付けエラー:", e);
            showMessage("紐付けに失敗しました", true);
        }
    };

    const handleCreateResidentHomeLink = async () => {
        if (!newResidentHomeLink.residentId || !newResidentHomeLink.homeId) {
            showMessage("高齢者と高齢者宅を選択してください", true);
            return;
        }
        try {
            const res = await fetch("/api/admin/relationships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "resident-home",
                    ...newResidentHomeLink,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setNewResidentHomeLink({ residentId: "", homeId: "" });
                await loadRelationships();
                showMessage("高齢者と高齢者宅を紐づけました");
            } else {
                showMessage(data.message || "紐付けに失敗しました", true);
            }
        } catch (e) {
            console.error("紐付けエラー:", e);
            showMessage("紐付けに失敗しました", true);
        }
    };

    const handleCreateSensorHomeLink = async () => {
        if (!newSensorHomeLink.sensorId || !newSensorHomeLink.homeId) {
            showMessage("センサーと高齢者宅を選択してください", true);
            return;
        }
        try {
            const res = await fetch("/api/admin/relationships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "home-sensor",
                    ...newSensorHomeLink,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setNewSensorHomeLink({
                    sensorId: "",
                    homeId: "",
                    roomName: "",
                });
                await loadSensors();
                await loadRelationships();
                showMessage("センサーと高齢者宅を紐づけました");
            } else {
                showMessage(data.message || "紐付けに失敗しました", true);
            }
        } catch (e) {
            console.error("紐付けエラー:", e);
            showMessage("紐付けに失敗しました", true);
        }
    };

    const handleDeleteRelationship = async (type: string, id: string) => {
        try {
            const res = await fetch(
                `/api/admin/relationships?type=${type}&id=${id}`,
                {
                    method: "DELETE",
                }
            );
            const data = await res.json();
            if (data.success) {
                await loadRelationships();
                showMessage("紐付けを削除しました");
            } else {
                showMessage(data.message || "削除に失敗しました", true);
            }
        } catch (e) {
            console.error("削除エラー:", e);
            showMessage("削除に失敗しました", true);
        }
    };

    const filteredUsers = users.filter(
        (u) =>
            u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredResidents = residents.filter((r) =>
        r.residentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredHomes = homes.filter(
        (h) =>
            h.homeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredSensors = sensors.filter(
        (s) =>
            s.sensorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.sensorType.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredUnregisteredSensors = unregisteredSensors.filter(
        (s) =>
            s.sensorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.sensorType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        loadUsers();
        loadResidents();
        loadHomes();
        loadSensors();
        loadRelationships();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <RouterLink to="/dashboard/staff">
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    戻る
                                </Button>
                            </RouterLink>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Settings className="h-6 w-6" />
                                    システム管理画面
                                </h1>
                                <p className="text-gray-600">
                                    利用者、高齢者、高齢者宅、センサーの管理と紐付け設定
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="利用者名、高齢者名、宅名、センサー名で検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-6"
                >
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger
                            value="users"
                            className="flex items-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            利用者
                        </TabsTrigger>
                        <TabsTrigger
                            value="residents"
                            className="flex items-center gap-2"
                        >
                            <UserCheck className="h-4 w-4" />
                            高齢者
                        </TabsTrigger>
                        <TabsTrigger
                            value="homes"
                            className="flex items-center gap-2"
                        >
                            <Home className="h-4 w-4" />
                            高齢者宅
                        </TabsTrigger>
                        <TabsTrigger
                            value="sensors"
                            className="flex items-center gap-2"
                        >
                            <Sensor className="h-4 w-4" />
                            センサー
                        </TabsTrigger>
                        <TabsTrigger
                            value="unregistered"
                            className="flex items-center gap-2"
                        >
                            <Sensor className="h-4 w-4" />
                            未登録
                        </TabsTrigger>
                        <TabsTrigger
                            value="relationships"
                            className="flex items-center gap-2"
                        >
                            <LinkIcon className="h-4 w-4" />
                            紐付け管理
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>利用者管理</CardTitle>
                                    <CardDescription>
                                        システムを利用する職員・家族の管理
                                    </CardDescription>
                                </div>
                                <Dialog
                                    open={isUserDialogOpen}
                                    onOpenChange={setIsUserDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            利用者を追加
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                新しい利用者を追加
                                            </DialogTitle>
                                            <DialogDescription>
                                                利用者の基本情報を入力してください
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="userName">
                                                    氏名
                                                </Label>
                                                <Input
                                                    id="userName"
                                                    value={newUser.userName}
                                                    onChange={(e) =>
                                                        setNewUser({
                                                            ...newUser,
                                                            userName:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="山田太郎"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="email">
                                                    メールアドレス
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={newUser.email}
                                                    onChange={(e) =>
                                                        setNewUser({
                                                            ...newUser,
                                                            email: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="yamada@example.com"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="role">
                                                    権限
                                                </Label>
                                                <Select
                                                    value={newUser.role}
                                                    onValueChange={(value) =>
                                                        setNewUser({
                                                            ...newUser,
                                                            role: value,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="staff">
                                                            職員
                                                        </SelectItem>
                                                        <SelectItem value="family">
                                                            家族
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                onClick={handleCreateUser}
                                                className="w-full"
                                            >
                                                登録
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredUsers.map((user) => (
                                        <Card key={user.userId} className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <h3 className="font-medium text-lg">
                                                        {user.userName}
                                                    </h3>
                                                    <p className="text-gray-600">
                                                        {user.email}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant={
                                                                user.role ===
                                                                "staff"
                                                                    ? "default"
                                                                    : "secondary"
                                                            }
                                                        >
                                                            {user.role ===
                                                            "staff"
                                                                ? "職員"
                                                                : "家族"}
                                                        </Badge>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(
                                                                user.createdAt
                                                            ).toLocaleDateString(
                                                                "ja-JP"
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="residents">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>高齢者管理</CardTitle>
                                    <CardDescription>
                                        見守り対象の高齢者の管理
                                    </CardDescription>
                                </div>
                                <Dialog
                                    open={isResidentDialogOpen}
                                    onOpenChange={setIsResidentDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            高齢者を追加
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                新しい高齢者を追加
                                            </DialogTitle>
                                            <DialogDescription>
                                                高齢者の基本情報を入力してください
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="residentName">
                                                    氏名
                                                </Label>
                                                <Input
                                                    id="residentName"
                                                    value={
                                                        newResident.residentName
                                                    }
                                                    onChange={(e) =>
                                                        setNewResident({
                                                            ...newResident,
                                                            residentName:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="田中花子"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="birthDate">
                                                    生年月日
                                                </Label>
                                                <Input
                                                    id="birthDate"
                                                    type="date"
                                                    value={
                                                        newResident.birthDate
                                                    }
                                                    onChange={(e) =>
                                                        setNewResident({
                                                            ...newResident,
                                                            birthDate:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <Button
                                                onClick={handleCreateResident}
                                                className="w-full"
                                            >
                                                登録
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredResidents.map((resident) => (
                                        <Card
                                            key={resident.residentId}
                                            className="p-4"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <h3 className="font-medium text-lg">
                                                        {resident.residentName}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span>
                                                            生年月日:{" "}
                                                            {new Date(
                                                                resident.birthDate
                                                            ).toLocaleDateString(
                                                                "ja-JP"
                                                            )}
                                                        </span>
                                                        <span>
                                                            年齢: {resident.age}
                                                            歳
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        登録日:{" "}
                                                        {new Date(
                                                            resident.createdAt
                                                        ).toLocaleDateString(
                                                            "ja-JP"
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="homes">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>高齢者宅管理</CardTitle>
                                    <CardDescription>
                                        見守り対象の住宅の管理
                                    </CardDescription>
                                </div>
                                <Dialog
                                    open={isHomeDialogOpen}
                                    onOpenChange={setIsHomeDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            高齢者宅を追加
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                新しい高齢者宅を追加
                                            </DialogTitle>
                                            <DialogDescription>
                                                高齢者宅の基本情報を入力してください
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="homeName">
                                                    宅名
                                                </Label>
                                                <Input
                                                    id="homeName"
                                                    value={newHome.homeName}
                                                    onChange={(e) =>
                                                        setNewHome({
                                                            ...newHome,
                                                            homeName:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="田中宅"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="address">
                                                    住所
                                                </Label>
                                                <Input
                                                    id="address"
                                                    value={newHome.address}
                                                    onChange={(e) =>
                                                        setNewHome({
                                                            ...newHome,
                                                            address:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="東京都渋谷区..."
                                                />
                                            </div>
                                            <Button
                                                onClick={handleCreateHome}
                                                className="w-full"
                                            >
                                                登録
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredHomes.map((home) => (
                                        <Card key={home.homeId} className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <h3 className="font-medium text-lg">
                                                        {home.homeName}
                                                    </h3>
                                                    <p className="text-gray-600">
                                                        {home.address}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span>
                                                            センサー数:{" "}
                                                            {home.sensorCount}個
                                                        </span>
                                                        <span>
                                                            登録日:{" "}
                                                            {new Date(
                                                                home.createdAt
                                                            ).toLocaleDateString(
                                                                "ja-JP"
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sensors">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>登録済みセンサー</CardTitle>
                                    <CardDescription>
                                        高齢者宅に配置済みのセンサー
                                    </CardDescription>
                                </div>
                                <Dialog
                                    open={isSensorDialogOpen}
                                    onOpenChange={setIsSensorDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            センサーを追加
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                新しいセンサーを追加
                                            </DialogTitle>
                                            <DialogDescription>
                                                センサーの基本情報を入力してください
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="sensorName">
                                                    センサー名
                                                </Label>
                                                <Input
                                                    id="sensorName"
                                                    value={newSensor.sensorName}
                                                    onChange={(e) =>
                                                        setNewSensor({
                                                            ...newSensor,
                                                            sensorName:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="リビング人感センサー"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="sensorType">
                                                    センサー種別
                                                </Label>
                                                <Select
                                                    value={newSensor.sensorType}
                                                    onValueChange={(value) =>
                                                        setNewSensor({
                                                            ...newSensor,
                                                            sensorType: value,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="motion">
                                                            人感センサー
                                                        </SelectItem>
                                                        <SelectItem value="door">
                                                            ドアセンサー
                                                        </SelectItem>
                                                        <SelectItem value="temperature">
                                                            温度センサー
                                                        </SelectItem>
                                                        <SelectItem value="humidity">
                                                            湿度センサー
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="homeId">
                                                    配置先
                                                </Label>
                                                <Select
                                                    value={newSensor.homeId}
                                                    onValueChange={(value) =>
                                                        setNewSensor({
                                                            ...newSensor,
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
                                                                key={
                                                                    home.homeId
                                                                }
                                                                value={
                                                                    home.homeId
                                                                }
                                                            >
                                                                {home.homeName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="roomName">
                                                    部屋名
                                                </Label>
                                                <Input
                                                    id="roomName"
                                                    value={newSensor.roomName}
                                                    onChange={(e) =>
                                                        setNewSensor({
                                                            ...newSensor,
                                                            roomName:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="リビング"
                                                />
                                            </div>
                                            <Button
                                                onClick={handleCreateSensor}
                                                className="w-full"
                                            >
                                                登録
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredSensors.map((sensor) => (
                                        <Card
                                            key={sensor.sensorId}
                                            className="p-4"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <h3 className="font-medium text-lg">
                                                        {sensor.sensorName}
                                                    </h3>
                                                    <p className="text-gray-600">
                                                        {sensor.sensorType}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span>
                                                            配置先:{" "}
                                                            {sensor.homeName}
                                                        </span>
                                                        <span>
                                                            部屋:{" "}
                                                            {sensor.roomName}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Badge
                                                            variant={
                                                                sensor.status ===
                                                                "active"
                                                                    ? "default"
                                                                    : "destructive"
                                                            }
                                                        >
                                                            {sensor.status ===
                                                            "active"
                                                                ? "稼働中"
                                                                : "停止"}
                                                        </Badge>
                                                        <span className="text-sm text-gray-500">
                                                            最終稼働:{" "}
                                                            {new Date(
                                                                sensor.lastActive
                                                            ).toLocaleString(
                                                                "ja-JP"
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="unregistered">
                        <Card>
                            <CardHeader>
                                <CardTitle>未登録センサー</CardTitle>
                                <CardDescription>
                                    検出されているが未配置のセンサー
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredUnregisteredSensors.map(
                                        (sensor) => (
                                            <Card
                                                key={sensor.sensorId}
                                                className="p-4"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-2">
                                                        <h3 className="font-medium text-lg">
                                                            {sensor.sensorName}
                                                        </h3>
                                                        <p className="text-gray-600">
                                                            {sensor.sensorType}
                                                        </p>
                                                        <div className="flex items-center gap-4">
                                                            <Badge variant="outline">
                                                                未登録
                                                            </Badge>
                                                            <span className="text-sm text-gray-500">
                                                                検出日時:{" "}
                                                                {new Date(
                                                                    sensor.lastActive
                                                                ).toLocaleString(
                                                                    "ja-JP"
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="relationships">
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        利用者 ↔ 高齢者
                                    </CardTitle>
                                    <CardDescription>
                                        家族関係の設定
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>利用者</Label>
                                        <Select
                                            value={newGuardianLink.userId}
                                            onValueChange={(value) =>
                                                setNewGuardianLink({
                                                    ...newGuardianLink,
                                                    userId: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="利用者を選択" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem
                                                        key={user.userId}
                                                        value={user.userId}
                                                    >
                                                        {user.userName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>高齢者</Label>
                                        <Select
                                            value={newGuardianLink.residentId}
                                            onValueChange={(value) =>
                                                setNewGuardianLink({
                                                    ...newGuardianLink,
                                                    residentId: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="高齢者を選択" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {residents.map((resident) => (
                                                    <SelectItem
                                                        key={
                                                            resident.residentId
                                                        }
                                                        value={
                                                            resident.residentId
                                                        }
                                                    >
                                                        {resident.residentName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>関係</Label>
                                        <Select
                                            value={newGuardianLink.relationship}
                                            onValueChange={(value) =>
                                                setNewGuardianLink({
                                                    ...newGuardianLink,
                                                    relationship: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="関係を選択" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="son">
                                                    息子
                                                </SelectItem>
                                                <SelectItem value="daughter">
                                                    娘
                                                </SelectItem>
                                                <SelectItem value="spouse">
                                                    配偶者
                                                </SelectItem>
                                                <SelectItem value="other">
                                                    その他
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        onClick={handleCreateGuardianLink}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        紐づけを作成
                                    </Button>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {relationships
                                            .filter(
                                                (r) =>
                                                    r.type === "user-resident"
                                            )
                                            .map((link) => (
                                                <div
                                                    key={link.id}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                                >
                                                    <div className="text-sm">
                                                        <span className="font-medium">
                                                            {link.fromName}
                                                        </span>
                                                        <span className="text-gray-500 mx-2">
                                                            →
                                                        </span>
                                                        <span>
                                                            {link.toName}
                                                        </span>
                                                        {link.relationship && (
                                                            <Badge
                                                                variant="outline"
                                                                className="ml-2 text-xs"
                                                            >
                                                                {
                                                                    link.relationship
                                                                }
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDeleteRelationship(
                                                                "user-resident",
                                                                link.id
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        高齢者 ↔ 高齢者宅
                                    </CardTitle>
                                    <CardDescription>
                                        居住関係の設定
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>高齢者</Label>
                                        <Select
                                            value={
                                                newResidentHomeLink.residentId
                                            }
                                            onValueChange={(value) =>
                                                setNewResidentHomeLink({
                                                    ...newResidentHomeLink,
                                                    residentId: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="高齢者を選択" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {residents.map((resident) => (
                                                    <SelectItem
                                                        key={
                                                            resident.residentId
                                                        }
                                                        value={
                                                            resident.residentId
                                                        }
                                                    >
                                                        {resident.residentName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>高齢者宅</Label>
                                        <Select
                                            value={newResidentHomeLink.homeId}
                                            onValueChange={(value) =>
                                                setNewResidentHomeLink({
                                                    ...newResidentHomeLink,
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
                                                        {home.homeName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        onClick={handleCreateResidentHomeLink}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        紐づけを作成
                                    </Button>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {relationships
                                            .filter(
                                                (r) =>
                                                    r.type === "resident-home"
                                            )
                                            .map((link) => (
                                                <div
                                                    key={link.id}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                                >
                                                    <div className="text-sm">
                                                        <span className="font-medium">
                                                            {link.fromName}
                                                        </span>
                                                        <span className="text-gray-500 mx-2">
                                                            →
                                                        </span>
                                                        <span>
                                                            {link.toName}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDeleteRelationship(
                                                                "resident-home",
                                                                link.id
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        センサー ↔ 高齢者宅
                                    </CardTitle>
                                    <CardDescription>
                                        設置場所の設定
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>センサー</Label>
                                        <Select
                                            value={newSensorHomeLink.sensorId}
                                            onValueChange={(value) =>
                                                setNewSensorHomeLink({
                                                    ...newSensorHomeLink,
                                                    sensorId: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="センサーを選択" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {unregisteredSensors.map(
                                                    (sensor) => (
                                                        <SelectItem
                                                            key={
                                                                sensor.sensorId
                                                            }
                                                            value={
                                                                sensor.sensorId
                                                            }
                                                        >
                                                            {sensor.sensorName}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>高齢者宅</Label>
                                        <Select
                                            value={newSensorHomeLink.homeId}
                                            onValueChange={(value) =>
                                                setNewSensorHomeLink({
                                                    ...newSensorHomeLink,
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
                                                        {home.homeName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>部屋名</Label>
                                        <Input
                                            value={newSensorHomeLink.roomName}
                                            onChange={(e) =>
                                                setNewSensorHomeLink({
                                                    ...newSensorHomeLink,
                                                    roomName: e.target.value,
                                                })
                                            }
                                            placeholder="リビング"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleCreateSensorHomeLink}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        紐づけを作成
                                    </Button>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {relationships
                                            .filter(
                                                (r) => r.type === "home-sensor"
                                            )
                                            .map((link) => (
                                                <div
                                                    key={link.id}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                                >
                                                    <div className="text-sm">
                                                        <span className="font-medium">
                                                            {link.fromName}
                                                        </span>
                                                        <span className="text-gray-500 mx-2">
                                                            →
                                                        </span>
                                                        <span>
                                                            {link.toName}
                                                        </span>
                                                        {link.roomName && (
                                                            <Badge
                                                                variant="outline"
                                                                className="ml-2 text-xs"
                                                            >
                                                                {link.roomName}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDeleteRelationship(
                                                                "home-sensor",
                                                                link.id
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Page;
