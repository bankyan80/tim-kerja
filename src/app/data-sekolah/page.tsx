"use client";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  School,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ColumnDef } from "@tanstack/react-table";

type StatusSekolah = "negeri" | "swasta";
type Akreditasi = "A" | "B" | "C" | "Belum";
type StatusAktif = "aktif" | "nonaktif";

interface Sekolah {
  id: string;
  npsn: string;
  nama: string;
  status: StatusSekolah;
  alamat: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  kode_pos: string;
  kepala_sekolah: string;
  nip_kepala_sekolah: string;
  operator: string;
  no_wa: string;
  email: string;
  akreditasi: Akreditasi;
  jumlah_rombel: number;
  latitude: number;
  longitude: number;
  status_aktif: StatusAktif;
}

const defaultForm: Sekolah = {
  id: "",
  npsn: "",
  nama: "",
  status: "negeri",
  alamat: "",
  desa: "",
  kecamatan: "Lemahabang",
  kabupaten: "Cirebon",
  kode_pos: "",
  kepala_sekolah: "",
  nip_kepala_sekolah: "",
  operator: "",
  no_wa: "",
  email: "",
  akreditasi: "Belum",
  jumlah_rombel: 0,
  latitude: 0,
  longitude: 0,
  status_aktif: "aktif",
};

export default function DataSekolahPage() {
  const { data: session } = useSession();
  const isOperator = session?.user?.role === "operator_sekolah";
  const userSekolahId = session?.user?.sekolah_id;

  const [data, setData] = useState<Sekolah[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Sekolah>(defaultForm);
  const [viewing, setViewing] = useState<Sekolah | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAkreditasi, setFilterAkreditasi] = useState<string>("");

  useEffect(() => {
    const url = isOperator && userSekolahId ? `/api/sekolah?id=${userSekolahId}` : "/api/sekolah";
    fetch(url).then(r => r.json()).then(d => {
      const result = Array.isArray(d) ? d : [d];
      setData(result);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isOperator, userSekolahId]);

  const filteredData = useMemo(() => {
    let result = data;
    if (isOperator && userSekolahId) {
      result = result.filter((s) => s.id === userSekolahId);
    }
    if (filterStatus) {
      result = result.filter((s) => s.status === filterStatus);
    }
    if (filterAkreditasi) {
      result = result.filter((s) => s.akreditasi === filterAkreditasi);
    }
    return result;
  }, [data, filterStatus, filterAkreditasi, isOperator, userSekolahId]);

  const columns: ColumnDef<Sekolah>[] = [
    {
      header: "NPSN",
      accessorKey: "npsn",
    },
    {
      header: "Nama Sekolah",
      accessorKey: "nama",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "negeri" ? "info" : "warning"}>
          {row.original.status === "negeri" ? "Negeri" : "Swasta"}
        </Badge>
      ),
    },
    {
      header: "Desa",
      accessorKey: "desa",
    },
    {
      header: "Akreditasi",
      accessorKey: "akreditasi",
      cell: ({ row }) => {
        const akr = row.original.akreditasi;
        const variant = akr === "A" ? "success" : akr === "B" ? "warning" : akr === "C" ? "danger" : "default";
        return <Badge variant={variant}>{akr}</Badge>;
      },
    },
    {
      header: "Jml Rombel",
      accessorKey: "jumlah_rombel",
    },
    {
      header: "Kepala Sekolah",
      accessorKey: "kepala_sekolah",
    },
    {
      header: "Status Aktif",
      accessorKey: "status_aktif",
      cell: ({ row }) => (
        <Badge variant={row.original.status_aktif === "aktif" ? "success" : "danger"}>
          {row.original.status_aktif === "aktif" ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      header: "Aksi",
      id: "aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewing(row.original)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Lihat"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(row.original)}
            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  function formatNamaSekolah(nama: string) {
    return nama.replace(/\bSd\b/gi, "SD").replace(/\bMi\b/gi, "MI").replace(/\bSmp\b/gi, "SMP").replace(/\bSma\b/gi, "SMA").replace(/\bSmk\b/gi, "SMK");
  }

  function openAddModal() {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function handleEdit(sekolah: Sekolah) {
    setEditingId(sekolah.id);
    setForm(sekolah);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (confirm("Yakin ingin menghapus data sekolah ini?")) {
      await fetch(`/api/sekolah?id=${id}`, { method: "DELETE" });
      setData((prev) => prev.filter((s) => s.id !== id));
      toast.success("Sekolah berhasil dihapus");
    }
  }

  async function handleSave() {
    const namaFormatted = formatNamaSekolah(form.nama);
    if (editingId) {
      const res = await fetch("/api/sekolah", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editingId, nama: namaFormatted }),
      });
      if (res.ok) {
        setData((prev) => prev.map((s) => (s.id === editingId ? { ...form, nama: namaFormatted, id: editingId } : s)));
        toast.success("Sekolah berhasil diupdate");
      }
    } else {
      const res = await fetch("/api/sekolah", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, nama: namaFormatted }),
      });
      if (res.ok) {
        const newId = String(Date.now());
        setData((prev) => [...prev, { ...form, nama: namaFormatted, id: newId }]);
        toast.success("Sekolah berhasil ditambahkan");
      }
    }
    setModalOpen(false);
  }

  function updateForm(key: keyof Sekolah, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <Loading message="Memuat data sekolah..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Sekolah</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kecamatan Lemahabang</p>
            </div>
          </div>
          {!isOperator && (
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Sekolah
          </Button>
          )}
        </div>

        {/* Filter */}
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              Filter:
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="negeri">Negeri</option>
              <option value="swasta">Swasta</option>
            </select>
            <select
              value={filterAkreditasi}
              onChange={(e) => setFilterAkreditasi(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Akreditasi</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="Belum">Belum</option>
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {filteredData.length === 0 ? (
              <EmptyState
                title="Belum ada data sekolah"
                message="Klik tombol Tambah Sekolah untuk menambahkan data."
                icon={<School className="w-12 h-12 text-gray-300" />}
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                searchPlaceholder="Cari NPSN, nama sekolah, desa..."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Data Sekolah" : "Tambah Data Sekolah"}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="NPSN"
            id="npsn"
            value={form.npsn}
            onChange={(e) => updateForm("npsn", e.target.value)}
          />
          <Input
            label="Nama Sekolah"
            id="nama"
            value={form.nama}
            onChange={(e) => updateForm("nama", e.target.value)}
            placeholder="Contoh: SD Negeri 1 Lemahabang"
          />
          <Select
            label="Status"
            id="status"
            value={form.status}
            onChange={(e) => updateForm("status", e.target.value)}
            options={[
              { value: "negeri", label: "Negeri" },
              { value: "swasta", label: "Swasta" },
            ]}
          />
          <Select
            label="Akreditasi"
            id="akreditasi"
            value={form.akreditasi}
            onChange={(e) => updateForm("akreditasi", e.target.value)}
            options={[
              { value: "A", label: "A" },
              { value: "B", label: "B" },
              { value: "C", label: "C" },
              { value: "Belum", label: "Belum" },
            ]}
          />
          <Input
            label="Desa"
            id="desa"
            value={form.desa}
            onChange={(e) => updateForm("desa", e.target.value)}
          />
          <Input
            label="Kecamatan"
            id="kecamatan"
            value={form.kecamatan}
            onChange={(e) => updateForm("kecamatan", e.target.value)}
          />
          <Input
            label="Kabupaten"
            id="kabupaten"
            value={form.kabupaten}
            onChange={(e) => updateForm("kabupaten", e.target.value)}
          />
          <Input
            label="Kode Pos"
            id="kode_pos"
            value={form.kode_pos}
            onChange={(e) => updateForm("kode_pos", e.target.value)}
          />
          <Input
            label="Kepala Sekolah"
            id="kepala_sekolah"
            value={form.kepala_sekolah}
            onChange={(e) => updateForm("kepala_sekolah", e.target.value)}
          />
          <Input
            label="NIP Kepala Sekolah"
            id="nip_kepala_sekolah"
            value={form.nip_kepala_sekolah}
            onChange={(e) => updateForm("nip_kepala_sekolah", e.target.value)}
          />
          <Input
            label="Operator"
            id="operator"
            value={form.operator}
            onChange={(e) => updateForm("operator", e.target.value)}
          />
          <Input
            label="No. WA"
            id="no_wa"
            value={form.no_wa}
            onChange={(e) => updateForm("no_wa", e.target.value)}
          />
          <Input
            label="Email"
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
          />
          <Input
            label="Jumlah Rombel"
            id="jumlah_rombel"
            type="number"
            value={form.jumlah_rombel}
            onChange={(e) => updateForm("jumlah_rombel", Number(e.target.value))}
          />
          <Input
            label="Latitude"
            id="latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => updateForm("latitude", Number(e.target.value))}
          />
          <Input
            label="Longitude"
            id="longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => updateForm("longitude", Number(e.target.value))}
          />
          <Select
            label="Status Aktif"
            id="status_aktif"
            value={form.status_aktif}
            onChange={(e) => updateForm("status_aktif", e.target.value)}
            options={[
              { value: "aktif", label: "Aktif" },
              { value: "nonaktif", label: "Nonaktif" },
            ]}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Alamat"
              id="alamat"
              value={form.alamat}
              onChange={(e) => updateForm("alamat", e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSave}>
            {editingId ? "Simpan Perubahan" : "Simpan"}
          </Button>
        </div>
      </Modal>

      {/* Modal Lihat Detail */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Detail Sekolah"
        size="lg"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField label="NPSN" value={viewing.npsn} />
              <DetailField label="Nama Sekolah" value={viewing.nama} />
              <DetailField
                label="Status"
                value={
                  <Badge variant={viewing.status === "negeri" ? "info" : "warning"}>
                    {viewing.status === "negeri" ? "Negeri" : "Swasta"}
                  </Badge>
                }
              />
              <DetailField
                label="Akreditasi"
                value={
                  <Badge
                    variant={
                      viewing.akreditasi === "A"
                        ? "success"
                        : viewing.akreditasi === "B"
                          ? "warning"
                          : viewing.akreditasi === "C"
                            ? "danger"
                            : "default"
                    }
                  >
                    {viewing.akreditasi}
                  </Badge>
                }
              />
              <DetailField label="Desa" value={viewing.desa} />
              <DetailField label="Kecamatan" value={viewing.kecamatan} />
              <DetailField label="Kabupaten" value={viewing.kabupaten} />
              <DetailField label="Kode Pos" value={viewing.kode_pos} />
              <DetailField label="Kepala Sekolah" value={viewing.kepala_sekolah} />
              <DetailField label="NIP Kepala Sekolah" value={viewing.nip_kepala_sekolah} />
              <DetailField label="Operator" value={viewing.operator} />
              <DetailField label="No. WA" value={viewing.no_wa} />
              <DetailField label="Email" value={viewing.email} />
              <DetailField label="Jumlah Rombel" value={String(viewing.jumlah_rombel)} />
              <DetailField label="Latitude" value={String(viewing.latitude)} />
              <DetailField label="Longitude" value={String(viewing.longitude)} />
              <DetailField
                label="Status Aktif"
                value={
                  <Badge variant={viewing.status_aktif === "aktif" ? "success" : "danger"}>
                    {viewing.status_aktif === "aktif" ? "Aktif" : "Nonaktif"}
                  </Badge>
                }
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">Alamat</span>
              <p className="text-sm text-gray-600">{viewing.alamat}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-medium text-gray-500 mb-0.5">{label}</span>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}
