"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Settings,
  User,
  Users,
  Shield,
  Database,
  Save,
  Upload,
  RefreshCw,
  Download,
  Plus,
  Trash2,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  Clock,
  HardDrive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { AppUser as UserType, UserRole } from "@/lib/types";

const tabs = [
  { id: "profil", label: "Profil", icon: User },
  { id: "aplikasi", label: "Aplikasi", icon: Settings },
  { id: "pengguna", label: "Pengguna", icon: Users },
  { id: "hak-akses", label: "Hak Akses", icon: Shield },
  { id: "backup", label: "Backup", icon: Database },
];

const roleOptions = [
  { value: "ketua", label: "Ketua" },
  { value: "admin", label: "Admin" },
  { value: "staf", label: "Staf" },
];

const statusOptions = [
  { value: "aktif", label: "Aktif" },
  { value: "nonaktif", label: "Nonaktif" },
];

const initialUsers: UserType[] = [
  { id: "1", email: "ketua@lemahabang.sch.id", name: "Drs. H. Ahmad Fauzi", role: "ketua", status: "aktif", created_at: "2025-07-01" },
  { id: "2", email: "admin@lemahabang.sch.id", name: "Siti Rahmawati, S.Pd.", role: "admin", status: "aktif", created_at: "2025-07-01" },
  { id: "3", email: "operator@sd1.sch.id", name: "Andi Pratama", role: "staf", status: "aktif", created_at: "2025-07-15" },
  { id: "4", email: "operator@sd2.sch.id", name: "Dewi Lestari", role: "staf", status: "aktif", created_at: "2025-07-15" },
  { id: "5", email: "bendahara@sd1.sch.id", name: "Rudi Hartono", role: "staf", status: "nonaktif", created_at: "2025-08-01" },
];

const modules = [
  "Dashboard", "Persuratan", "Data Sekolah", "Data Siswa",
  "Data GTK", "Laporan", "Sarpras", "SPMB", "Kegiatan",
  "Arsip", "Monitoring", "Rekap", "Pengaturan",
] as const;

type PermissionAction = "view" | "create" | "edit" | "delete" | "verify";

type PermissionMap = Record<string, Record<UserRole, Record<PermissionAction, boolean>>>;

const initialPermissions: PermissionMap = {
  Dashboard: {
    ketua: { view: true, create: false, edit: false, delete: false, verify: true },
    admin: { view: true, create: false, edit: false, delete: false, verify: false },
    staf: { view: true, create: false, edit: false, delete: false, verify: false },
  },
  Persuratan: {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: true },
    staf: { view: true, create: true, edit: false, delete: false, verify: false },
  },
  "Data Sekolah": {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: true },
    staf: { view: true, create: false, edit: false, delete: false, verify: false },
  },
  "Data Siswa": {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: true },
    staf: { view: true, create: true, edit: true, delete: false, verify: false },
  },
  "Data GTK": {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: true },
    staf: { view: true, create: false, edit: true, delete: false, verify: false },
  },
  Laporan: {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: true },
    staf: { view: true, create: true, edit: false, delete: false, verify: false },
  },
  Sarpras: {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: false },
    staf: { view: true, create: true, edit: false, delete: false, verify: false },
  },
  SPMB: {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: true },
    staf: { view: true, create: true, edit: true, delete: false, verify: false },
  },
  Kegiatan: {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: true },
    staf: { view: true, create: true, edit: false, delete: false, verify: false },
  },
  Arsip: {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: true },
    staf: { view: true, create: true, edit: false, delete: false, verify: false },
  },
  Monitoring: {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: false },
    staf: { view: true, create: false, edit: false, delete: false, verify: false },
  },
  Rekap: {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: true, edit: true, delete: false, verify: true },
    staf: { view: true, create: false, edit: false, delete: false, verify: false },
  },
  Pengaturan: {
    ketua: { view: true, create: true, edit: true, delete: true, verify: true },
    admin: { view: true, create: false, edit: false, delete: false, verify: false },
    staf: { view: false, create: false, edit: false, delete: false, verify: false },
  },
};

const backupHistory = [
  { id: "1", tanggal: "2026-06-14 23:00", ukuran: "156 MB", status: "sukses" as const },
  { id: "2", tanggal: "2026-06-13 23:00", ukuran: "152 MB", status: "sukses" as const },
  { id: "3", tanggal: "2026-06-12 23:00", ukuran: "150 MB", status: "sukses" as const },
  { id: "4", tanggal: "2026-06-11 06:30", ukuran: "148 MB", status: "gagal" as const },
  { id: "5", tanggal: "2026-06-10 23:00", ukuran: "147 MB", status: "sukses" as const },
];

export default function PengaturanPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profil");
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [permissions, setPermissions] = useState<PermissionMap>(initialPermissions);

  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserRole, setAddUserRole] = useState<UserRole>("staf");

  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editUserRole, setEditUserRole] = useState<UserRole>("staf");
  const [editUserStatus, setEditUserStatus] = useState<"aktif" | "nonaktif">("aktif");

  const roleLabels: Record<UserRole, string> = { ketua: "Ketua", admin: "Admin", staf: "Staf" };
  const permissionLabels: Record<PermissionAction, string> = {
    view: "Lihat", create: "Buat", edit: "Edit", delete: "Hapus", verify: "Verifikasi",
  };

  const isAdmin = session?.user?.role === "ketua" || session?.user?.role === "admin";

  if (loading) return <Loading message="Memuat pengaturan..." />;

  function handleAddUser() {
    if (!addUserEmail.trim()) return;
    const newUser: UserType = {
      id: String(Date.now()),
      email: addUserEmail.trim(),
      name: addUserEmail.split("@")[0],
      role: addUserRole,
      status: "aktif",
      created_at: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newUser]);
    setAddUserEmail("");
    setAddUserRole("staf");
    setShowAddUser(false);
  }

  function openEditUser(user: UserType) {
    setEditingUser(user);
    setEditUserRole(user.role);
    setEditUserStatus(user.status);
  }

  function handleEditUser() {
    if (!editingUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id ? { ...u, role: editUserRole, status: editUserStatus } : u
      )
    );
    setEditingUser(null);
  }

  function togglePermission(mod: string, role: UserRole, action: PermissionAction) {
    setPermissions((prev) => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [role]: {
          ...prev[mod][role],
          [action]: !prev[mod][role][action],
        },
      },
    }));
  }

  const TabIcon = tabs.find((t) => t.id === activeTab)?.icon || Settings;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
            <TabIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kecamatan Lemahabang</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profil */}
        {activeTab === "profil" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profil Pengguna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-lg space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold shrink-0">
                    {session?.user?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Foto Profil</p>
                    <Button size="sm" variant="outline" className="mt-1">
                      <Upload className="w-3 h-3 mr-1" />
                      Unggah Foto
                    </Button>
                  </div>
                </div>
                <Input label="Nama Lengkap" id="nama" defaultValue={session?.user?.name || ""} />
                <Input label="Email" id="email" type="email" defaultValue={session?.user?.email || ""} />
                <Input label="Password Baru" id="password" type="password" placeholder="Biarkan kosong jika tidak diubah" />
                <div className="flex justify-end pt-2">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Profil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aplikasi */}
        {activeTab === "aplikasi" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Pengaturan Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-lg space-y-4">
                <Input label="Nama Aplikasi" id="nama_aplikasi" defaultValue="Sistem Informasi Kecamatan Lemahabang" />
                <Input label="Instansi" id="instansi" defaultValue="Kecamatan Lemahabang" />
                <Input label="Wilayah" id="wilayah" defaultValue="Kecamatan Lemahabang, Kabupaten Cirebon" />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Logo Aplikasi</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border">
                      <Upload className="w-6 h-6" />
                    </div>
                    <Button size="sm" variant="outline">
                      <Upload className="w-3 h-3 mr-1" />
                      Unggah Logo
                    </Button>
                  </div>
                </div>
                <Select
                  label="Tahun Pelajaran Aktif"
                  id="tahun_pelajaran"
                  defaultValue="2025/2026"
                  options={[
                    { value: "2024/2025", label: "2024/2025" },
                    { value: "2025/2026", label: "2025/2026" },
                    { value: "2026/2027", label: "2026/2027" },
                  ]}
                />
                <Input
                  label="Format Penomoran Surat"
                  id="format_nomor"
                  defaultValue="{nomor}/SURAT/{bulan_romawi}/{tahun}"
                />
                <div className="flex justify-end pt-2">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Pengaturan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pengguna */}
        {activeTab === "pengguna" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Manajemen Pengguna
              </CardTitle>
              {isAdmin && (
                <Button size="sm" onClick={() => setShowAddUser(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Pengguna
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState
                  title="Belum ada pengguna"
                  message="Tambahkan pengguna baru untuk mulai."
                  icon={<Users className="w-12 h-12 text-gray-300" />}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user, idx) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                          <td className="px-4 py-3 text-gray-600">{user.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant={user.role === "ketua" ? "danger" : user.role === "admin" ? "info" : "default"}>
                              {roleLabels[user.role]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${user.status === "aktif" ? "bg-green-500" : "bg-red-500"}`} />
                              <span className={user.status === "aktif" ? "text-green-700" : "text-red-700"}>
                                {user.status === "aktif" ? "Aktif" : "Nonaktif"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isAdmin && (
                              <button
                                onClick={() => openEditUser(user)}
                                className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Hak Akses */}
        {activeTab === "hak-akses" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Pengaturan Hak Akses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50">Modul</th>
                      {(["ketua", "admin", "staf"] as const).map((role) => (
                        <th
                          key={role}
                          colSpan={5}
                          className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase border-l"
                        >
                          {roleLabels[role]}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th className="px-4 py-2 sticky left-0 bg-gray-50"></th>
                      {(["ketua", "admin", "staf"] as const).map((role) =>
                        (["view", "create", "edit", "delete", "verify"] as const).map((action) => (
                          <th
                            key={`${role}-${action}`}
                            className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase border-l"
                          >
                            {permissionLabels[action]}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modules.map((mod) => (
                      <tr key={mod} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white whitespace-nowrap">
                          {mod}
                        </td>
                        {(["ketua", "admin", "staf"] as const).map((role) =>
                          (["view", "create", "edit", "delete", "verify"] as const).map((action) => (
                            <td key={`${mod}-${role}-${action}`} className="px-2 py-3 text-center border-l">
                              {isAdmin ? (
                                <button
                                  onClick={() => togglePermission(mod, role, action)}
                                  className={`w-5 h-5 rounded border flex items-center justify-center mx-auto transition-colors ${
                                    permissions[mod][role][action]
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "border-gray-300 hover:border-gray-400"
                                  }`}
                                >
                                  {permissions[mod][role][action] && <Check className="w-3 h-3" />}
                                </button>
                              ) : (
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mx-auto ${
                                  permissions[mod][role][action]
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-gray-200"
                                }`}>
                                  {permissions[mod][role][action] && <Check className="w-3 h-3" />}
                                </div>
                              )}
                            </td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isAdmin && (
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Hak Akses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Backup */}
        {activeTab === "backup" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Backup Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Terakhir Backup</p>
                        <p className="text-xs text-blue-600">14 Juni 2026, 23:00 WIB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <HardDrive className="w-5 h-5 text-green-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Ukuran Database</p>
                        <p className="text-xs text-green-600">~156 MB</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button>
                      <Download className="w-4 h-4 mr-2" />
                      Buat Backup
                    </Button>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Pulihkan Backup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Riwayat Backup
                </CardTitle>
              </CardHeader>
              <CardContent>
                {backupHistory.length === 0 ? (
                  <EmptyState
                    title="Belum ada backup"
                    message="Buat backup pertama untuk mulai."
                    icon={<Database className="w-12 h-12 text-gray-300" />}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ukuran</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {backupHistory.map((b, idx) => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                            <td className="px-4 py-3 text-gray-900">{b.tanggal}</td>
                            <td className="px-4 py-3 text-gray-600">{b.ukuran}</td>
                            <td className="px-4 py-3">
                              <Badge variant={b.status === "sukses" ? "success" : "danger"}>
                                {b.status === "sukses" ? "Sukses" : "Gagal"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Pulihkan"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal Tambah Pengguna */}
      <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title="Tambah Pengguna" size="md">
        <div className="space-y-4">
          <Input
            label="Email"
            id="email_add"
            type="email"
            value={addUserEmail}
            onChange={(e) => setAddUserEmail(e.target.value)}
            placeholder="user@example.com"
          />
          <Select
            label="Role"
            id="role_add"
            value={addUserRole}
            onChange={(e) => setAddUserRole(e.target.value as UserRole)}
            options={roleOptions}
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Batal</Button>
            <Button onClick={handleAddUser}>Tambah</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Edit Pengguna */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Edit Pengguna" size="md">
        {editingUser && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{editingUser.name}</p>
              <p className="text-xs text-gray-500">{editingUser.email}</p>
            </div>
            <Select
              label="Role"
              id="role_edit"
              value={editUserRole}
              onChange={(e) => setEditUserRole(e.target.value as UserRole)}
              options={roleOptions}
            />
            <Select
              label="Status"
              id="status_edit"
              value={editUserStatus}
              onChange={(e) => setEditUserStatus(e.target.value as "aktif" | "nonaktif")}
              options={statusOptions}
            />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingUser(null)}>Batal</Button>
              <Button onClick={handleEditUser}>Simpan</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
