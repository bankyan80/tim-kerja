"use client";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
  ClipboardList,
  Plus,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ColumnDef } from "@tanstack/react-table";

interface SPMB {
  id: string;
  sekolah_id: string;
  tahun_pelajaran: string;
  daya_tampung: number;
  pendaftar: number;
  diterima: number;
  jalur_domisili: number;
  jalur_afirmasi: number;
  jalur_mutasi: number;
}

interface SekolahOption {
  id: string;
  nama: string;
}

const sekolahList: { id: string; nama: string }[] = [];

const tahunPelajaranOptions = [
  "2024/2025",
  "2025/2026",
  "2026/2027",
];



const defaultForm: SPMB = {
  id: "",
  sekolah_id: "",
  tahun_pelajaran: "2025/2026",
  daya_tampung: 0,
  pendaftar: 0,
  diterima: 0,
  jalur_domisili: 0,
  jalur_afirmasi: 0,
  jalur_mutasi: 0,
};

export default function SPMBPage() {
  const { data: session } = useSession();
  const isOperator = session?.user?.role === "operator_sekolah";
  const userSekolahId = session?.user?.sekolah_id;

  const [data, setData] = useState<SPMB[]>([]);
  const [loading, setLoading] = useState(true);
  const [sekolahList, setSekolahList] = useState<{ id: string; nama: string }[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (isOperator && userSekolahId) params.set("sekolah_id", userSekolahId);
    const url = `/api/spmb${params.toString() ? "?" + params.toString() : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch("/api/sekolah").then(r => r.json()).then(d => setSekolahList(d.map((s: any) => ({ id: s.id, nama: s.nama })))).catch(() => {});
  }, [isOperator, userSekolahId]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SPMB>(defaultForm);
  const [viewing, setViewing] = useState<SPMB | null>(null);
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let result = data;
    if (filterSekolah) {
      result = result.filter((s) => s.sekolah_id === filterSekolah);
    }
    if (filterTahun) {
      result = result.filter((s) => s.tahun_pelajaran === filterTahun);
    }
    return result;
  }, [data, filterSekolah, filterTahun]);

  const columns: ColumnDef<SPMB>[] = [
    {
      header: "No",
      id: "no",
      cell: ({ row }) => row.index + 1,
    },
    {
      header: "Sekolah",
      accessorKey: "sekolah_id",
      cell: ({ row }) => {
        const sekolah = sekolahList.find((s) => s.id === row.original.sekolah_id);
        return sekolah?.nama || "-";
      },
    },
    { header: "Tahun Pelajaran", accessorKey: "tahun_pelajaran" },
    { header: "Daya Tampung", accessorKey: "daya_tampung" },
    { header: "Pendaftar", accessorKey: "pendaftar" },
    { header: "Diterima", accessorKey: "diterima" },
    { header: "Jalur Domisili", accessorKey: "jalur_domisili" },
    { header: "Jalur Afirmasi", accessorKey: "jalur_afirmasi" },
    { header: "Jalur Mutasi", accessorKey: "jalur_mutasi" },
    {
      header: "Aksi",
      id: "aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewing(row.original)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Detail"
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
            onClick={() => setConfirmDelete(row.original.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  function openAddModal() {
    setEditingId(null);
    setForm({ ...defaultForm, sekolah_id: isOperator && userSekolahId ? userSekolahId : "" });
    setModalOpen(true);
  }

  function handleEdit(spmb: SPMB) {
    setEditingId(spmb.id);
    setForm(spmb);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await fetch(`/api/spmb?id=${confirmDelete}`, { method: "DELETE" });
      setData((prev) => prev.filter((s) => s.id !== confirmDelete));
      toast.success("Data SPMB berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus data SPMB");
    }
    setConfirmDelete(null);
  }

  async function handleSave() {
    try {
      if (editingId) {
        const res = await fetch("/api/spmb", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setData((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        toast.success("Data SPMB berhasil diperbarui");
      } else {
        const res = await fetch("/api/spmb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setData((prev) => [...prev, created]);
        toast.success("Data SPMB berhasil dibuat");
      }
    } catch {
      toast.error("Gagal menyimpan data SPMB");
    }
    setModalOpen(false);
  }

  function updateForm(key: keyof SPMB, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <Loading message="Memuat data SPMB..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SPMB</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Seleksi Penerimaan Murid Baru - Kecamatan Lemahabang
              </p>
            </div>
          </div>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Data SPMB
          </Button>
        </div>

        {/* Info NIK Ganda */}
        <Card className="bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800">
            Sistem akan mencegah pendaftaran dengan NIK ganda pada tahun pelajaran yang sama di sekolah yang berbeda.
          </p>
        </Card>

        {/* Filter */}
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-gray-500">Filter:</span>
            {!isOperator && (
            <select
              value={filterSekolah}
              onChange={(e) => setFilterSekolah(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Sekolah</option>
              {sekolahList.map((s) => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
            )}
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Tahun Pelajaran</option>
              {tahunPelajaranOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {filteredData.length === 0 ? (
              <EmptyState
                title="Belum ada data SPMB"
                message="Klik tombol Tambah Data SPMB untuk menambahkan data."
                icon={<ClipboardList className="w-12 h-12 text-gray-300" />}
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                searchable={false}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Data SPMB" : "Tambah Data SPMB"}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isOperator ? (
            <input type="hidden" name="sekolah_id" value={userSekolahId || ""} />
          ) : (
          <Select
            label="Sekolah"
            id="sekolah_id"
            value={form.sekolah_id}
            onChange={(e) => updateForm("sekolah_id", e.target.value)}
            options={sekolahList.map((s) => ({ value: s.id, label: s.nama }))}
          />
          )}
          <Select
            label="Tahun Pelajaran"
            id="tahun_pelajaran"
            value={form.tahun_pelajaran}
            onChange={(e) => updateForm("tahun_pelajaran", e.target.value)}
            options={tahunPelajaranOptions.map((t) => ({ value: t, label: t }))}
          />
          <Input
            label="Daya Tampung"
            id="daya_tampung"
            type="number"
            value={form.daya_tampung}
            onChange={(e) => updateForm("daya_tampung", Number(e.target.value))}
          />
          <Input
            label="Pendaftar"
            id="pendaftar"
            type="number"
            value={form.pendaftar}
            onChange={(e) => updateForm("pendaftar", Number(e.target.value))}
          />
          <Input
            label="Diterima"
            id="diterima"
            type="number"
            value={form.diterima}
            onChange={(e) => updateForm("diterima", Number(e.target.value))}
          />
          <Input
            label="Jalur Domisili"
            id="jalur_domisili"
            type="number"
            value={form.jalur_domisili}
            onChange={(e) => updateForm("jalur_domisili", Number(e.target.value))}
          />
          <Input
            label="Jalur Afirmasi"
            id="jalur_afirmasi"
            type="number"
            value={form.jalur_afirmasi}
            onChange={(e) => updateForm("jalur_afirmasi", Number(e.target.value))}
          />
          <Input
            label="Jalur Mutasi"
            id="jalur_mutasi"
            type="number"
            value={form.jalur_mutasi}
            onChange={(e) => updateForm("jalur_mutasi", Number(e.target.value))}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button onClick={handleSave}>{editingId ? "Simpan Perubahan" : "Simpan"}</Button>
        </div>
      </Modal>

      {/* Modal Lihat Detail */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Detail SPMB"
        size="lg"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField
                label="Sekolah"
                value={sekolahList.find((s) => s.id === viewing.sekolah_id)?.nama || "-"}
              />
              <DetailField label="Tahun Pelajaran" value={viewing.tahun_pelajaran} />
              <DetailField label="Daya Tampung" value={String(viewing.daya_tampung)} />
              <DetailField label="Pendaftar" value={String(viewing.pendaftar)} />
              <DetailField label="Diterima" value={String(viewing.diterima)} />
              <DetailField label="Jalur Domisili" value={String(viewing.jalur_domisili)} />
              <DetailField label="Jalur Afirmasi" value={String(viewing.jalur_afirmasi)} />
              <DetailField label="Jalur Mutasi" value={String(viewing.jalur_mutasi)} />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirm Delete */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Apakah Anda yakin ingin menghapus data SPMB ini? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
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
