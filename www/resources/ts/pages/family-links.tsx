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

// === API ===
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const authHeaders = () => {
  const t = localStorage.getItem("token");
  return { Accept: "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};
async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...init.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data;
}

// === サーバーレスポンス → 画面用に整形
const mapUser = (r: any) => ({
  userId: r.user_id ?? r.userId,
  userName: r.user_name ?? r.userName,
  email: r.email ?? "",
  role: r.role ?? "family",
  isActive: r.is_active ?? r.isActive ?? true,
});

const mapResident = (r: any): Resident => {
  // API が nested な linked_families を返す場合にも対応して安全に整形
  const rawLF = r.linked_families ?? r.linkedFamilies;
  const linkedFamilies = Array.isArray(rawLF)
    ? rawLF.map((lf: any) => ({
        userId: lf.user_id ?? lf.userId ?? "",
        userName: lf.user_name ?? lf.userName ?? "",
        relationship: lf.relationship ?? "",
        linkedDate:
          lf.linked_date ??
          lf.linkedDate ??
          lf.created_at ??
          lf.createdAt ??
          "",
      }))
    : [];

  return {
    residentId: r.resident_id ?? r.residentId ?? "",
    residentName: r.resident_name ?? r.residentName ?? "",
    homeId: r.home_id ?? r.homeId ?? "",
    homeName: r.home_name ?? r.homeName ?? "",
    address: r.address ?? "",
    dateOfBirth: r.date_of_birth ?? r.dateOfBirth ?? "",
    linkedFamilies, // ← ここで必ず配列を入れる
  };
};

const mapHome = (r: any) => ({
  homeId: r.home_id ?? r.homeId,
  homeName: r.home_name ?? r.homeName,
  address: r.address ?? "",
});

const mapFamilyUser = (r: any): FamilyUser => {
  const rawLR = r.linked_residents ?? r.linkedResidents;
  const linkedResidents = Array.isArray(rawLR)
    ? rawLR.map((x: any) => ({
        residentId: x.resident_id ?? x.residentId ?? "",
        residentName: x.resident_name ?? x.residentName ?? "",
        homeId: x.home_id ?? x.homeId ?? "",
        homeName: x.home_name ?? x.homeName ?? "",
        relationship: x.relationship ?? "",
        linkedDate:
          x.linked_date ?? x.linkedDate ?? x.created_at ?? x.createdAt ?? "",
      }))
    : [];

  return {
    userId: r.user_id ?? r.userId ?? "",
    userName: r.user_name ?? r.userName ?? "",
    email: r.email ?? "",
    isActive: r.is_active ?? r.isActive ?? true,
    linkedResidents,
  };
};


// 関係: ユーザ↔高齢者
type RelUserResident = {
  id: string; type: "user-resident"; userId: string; residentId: string;
  relationship?: string; createdAt?: string;
};
const mapRelUserResident = (r: any): RelUserResident => ({
  id: String(r.id),
  type: "user-resident",
  userId: r.user_id ?? r.userId ?? r.from_id,     // サーバのキー名ゆらぎに対応
  residentId: r.resident_id ?? r.residentId ?? r.to_id,
  relationship: r.relationship,
  createdAt: r.created_at ?? r.createdAt,
});

// 関係: 高齢者↔宅（最新の在住を採用）
type RelResidentHome = {
  id: string; type: "resident-home"; residentId: string; homeId: string;
  assignedFrom?: string; assignedTo?: string;
};
const mapRelResidentHome = (r: any): RelResidentHome => ({
  id: String(r.id),
  type: "resident-home",
  residentId: r.resident_id ?? r.residentId ?? r.from_id,
  homeId: r.home_id ?? r.homeId ?? r.to_id,
  assignedFrom: r.assigned_from ?? r.assignedFrom,
  assignedTo: r.assigned_to ?? r.assignedTo,
});

// 表示ラベル（APIが son/daughter... を返すケースに対応）
const relLabel = (v?: string) => {
  switch ((v ?? "").toLowerCase()) {
    case "son": return "息子";
    case "daughter": return "娘";
    case "spouse": return "配偶者";
    case "grandchild": return "孫";
    case "sibling": return "兄弟姉妹";
    case "other": return "その他";
    default: return v || "未設定";
  }
};
const lc = (x: any) => (x ?? "").toString().toLowerCase();


export default function LinkManagementPage() {
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


    // state は既存を再利用
const [familyUsers, setFamilyUsers] = useState<FamilyUser[]>([]);
const [residents, setResidents] = useState<Resident[]>([]);
const [sensorLinks, setSensorLinks] = useState<SensorLink[]>([]); // ←この画面では使わないなら残してOK
const [homes, setHomes] = useState<HomeData[]>([]);
const [searchTerm, setSearchTerm] = useState("");

// 追加: 生データ用
const [allUsersRaw, setAllUsersRaw] = useState<any[]>([]);
const [relsUserResident, setRelsUserResident] = useState<RelUserResident[]>([]);
const [relsResidentHome, setRelsResidentHome] = useState<RelResidentHome[]>([]);

// 宅マップ/居住マップを作成
const buildFamilyView = (usersRaw: any[], residentsArr: Resident[], homesArr: HomeData[],
                         urr: RelUserResident[], rrh: RelResidentHome[]) => {
  const users = usersRaw.map(mapUser);
  const familyOnly = users.filter(u => u.role === "family");

  const homesById = new Map(homesArr.map(h => [h.homeId, h]));
  const residentsById = new Map(residentsArr.map(r => [r.residentId, r]));

  // residentId → 現在（または最新）の homeId を引けるように
  const currentHomeByResident = new Map<string, RelResidentHome>();
  rrh.forEach(rel => {
    const prev = currentHomeByResident.get(rel.residentId);
    // assignedTo が NULL/空のものを優先。両方空なら assignedFrom が新しい方を採用。
    const isCurrent = !rel.assignedTo;
    if (!prev) {
      currentHomeByResident.set(rel.residentId, rel);
    } else {
      const prevIsCurrent = !prev.assignedTo;
      if (isCurrent && !prevIsCurrent) {
        currentHomeByResident.set(rel.residentId, rel);
      } else if ((rel.assignedFrom ?? "") > (prev.assignedFrom ?? "")) {
        currentHomeByResident.set(rel.residentId, rel);
      }
    }
  });

  const familyUsersView: FamilyUser[] = familyOnly.map(u => {
    const links = urr.filter(x => x.userId === u.userId);
    const linkedResidents = links.map(l => {
      const res = residentsById.get(l.residentId);
      const rh = currentHomeByResident.get(l.residentId);
      const home = rh ? homesById.get(rh.homeId) : (res?.homeId ? homesById.get(res.homeId) : undefined);
      return {
        residentId: l.residentId,
        residentName: res?.residentName ?? "(名称未設定)",
        homeId: home?.homeId ?? "",
        homeName: home?.homeName ?? "",
        relationship: relLabel(l.relationship),
        linkedDate: l.createdAt ?? "",
      };
    });
    return {
      userId: u.userId,
      userName: u.userName,
      email: u.email,
      isActive: u.isActive,
      linkedResidents,
    };
  });

  return familyUsersView;
};

// 実データをロード
useEffect(() => {
  (async () => {
    try {
      // 可能なら types をまとめて取得（なければ個別GETでもOK）
      const [{ users }, { residents: resArr }, { homes: homesArr }, { relationships }] =
        await Promise.all([
          apiFetch<{ users: any[] }>("/api/admin/users"),
          apiFetch<{ residents: any[] }>("/api/admin/residents"),
          apiFetch<{ homes: any[] }>("/api/admin/homes"),
          apiFetch<{ relationships: any[] }>("/api/admin/relationships?types=user-resident,resident-home"),
        ]);

      const urr = (relationships || [])
        .filter((r: any) => (r.type ?? r.relation_type) === "user-resident")
        .map(mapRelUserResident);

      const rrh = (relationships || [])
        .filter((r: any) => (r.type ?? r.relation_type) === "resident-home")
        .map(mapRelResidentHome);

      const resMapped = (resArr || []).map(mapResident);
      const homesMapped = (homesArr || []).map(mapHome);

      setAllUsersRaw(users || []);
      setResidents(resMapped);
      setHomes(homesMapped);
      setRelsUserResident(urr);
      setRelsResidentHome(rrh);

      // 家族ユーザーごとの紐づけ一覧を構築
      setFamilyUsers(buildFamilyView(users || [], resMapped, homesMapped, urr, rrh));
    } catch (e) {
      console.error("ロード失敗:", e);
    }
  })();
}, []);

async function reloadFamilyView() {
  const { relationships } = await apiFetch<{ relationships: any[] }>(
    "/api/admin/relationships?types=user-resident,resident-home"
  );

  const urr = (relationships || [])
    .filter((r: any) => (r.type ?? r.relation_type) === "user-resident")
    .map(mapRelUserResident);

  const rrh = (relationships || [])
    .filter((r: any) => (r.type ?? r.relation_type) === "resident-home")
    .map(mapRelResidentHome);

  setRelsUserResident(urr);
  setRelsResidentHome(rrh);

  // 既存の users/residents/homes の state を使って再構成
  setFamilyUsers(buildFamilyView(allUsersRaw, residents, homes, urr, rrh));
}


    const handleCreateFamilyLink = async () => {
        const { familyUserId, residentId, relationship } = newFamilyLinkData;
        if (!familyUserId || !residentId || !relationship) {
            alert("すべての項目を入力してください");
            return;
        }
        try {
            await apiFetch("/api/admin/relationships", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "user-resident",
                userId: familyUserId,
                residentId,
                relationship,       // 日本語のままでも可
            }),
            });

            await reloadFamilyView();

            setIsFamilyLinkDialogOpen(false);
            setNewFamilyLinkData({ familyUserId: "", residentId: "", relationship: "" });
        } catch (e:any) {
            alert(e?.message ?? "登録に失敗しました");
        }
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

    const handleDeleteLink = async (type: string, id1: string, id2: string) => {
        if (!confirm("この紐づけを削除してもよろしいですか？")) return;

        try {
            if (type === "family") {
            // 2パターンどちらでも動くように実装（サーバ側の仕様に合わせて片方にしてOK）
            // ① userId/residentId で削除
            await apiFetch<{ success?: boolean; message?: string }>(
                `/api/admin/guardians?userId=${encodeURIComponent(id1)}&residentId=${encodeURIComponent(id2)}`,
                { method: "DELETE" }
            );

            // ② もし上の仕様ではなく /api/admin/guardians/:id なら、relsUserResident から ID を引いて削除する:
            // const hit = relsUserResident.find(g => g.userId === id1 && g.residentId === id2);
            // if (hit) {
            //   await apiFetch(`/api/admin/guardians/${hit.id}`, { method: "DELETE" });
            // }

            await reloadFamilyView();
            alert("紐づけが削除されました");
            return;
            }

            // 他タイプ（resident-home / sensor）は既存の処理のまま
            console.log("紐づけを削除:", { type, id1, id2 });
            alert("紐づけが削除されました");
        } catch (e: any) {
            alert(`削除に失敗しました: ${e?.message ?? e}`);
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
        lc(user.userName).includes(lc(searchTerm)) ||
        lc(user.email).includes(lc(searchTerm)) ||
        user.linkedResidents.some((r) => lc(r.residentName).includes(lc(searchTerm)))
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
                                                <SelectTrigger className="h-fit min-h-12">
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
                                                                            ID :{" "}
                                                                            {
                                                                                resident.residentId
                                                                            }
                                                                        </div>
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
                                                <div className="text-sm text-muted-foreground space-y-1">
                                                    <div>ユーザーID: {familyUser.userId}</div>
                                                    <div>メール: {familyUser.email}</div>
                                                </div>
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
                                                    <div className="text-sm text-muted-foreground space-y-1">
                                                        <div>宅ID: {home.homeId}</div>
                                                        <div>住所: {home.address}</div>
                                                    </div>
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
                                                <div className="text-sm text-muted-foreground space-y-1">
                                                    <div>センサーID: {sensor.sensorId}</div>
                                                    <div>シリアル番号: {sensor.serialNumber}</div>
                                                    <div>種別: {getSensorTypeLabel(sensor.sensorType)}</div>
                                                </div>
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
