"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Pencil, Printer, Trash2, ArrowRight } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateShort } from "@/lib/utils";
import toast from "react-hot-toast";

type SuratMasuk = {
  id: string;
  nomor_agenda: string;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_diterima: string;
  asal_surat: string;
  perihal: string;
  klasifikasi: string;
  status: string;
  catatan: string;
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "dikirim", label: "Dikirim" },
  { value: "diproses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
  { value: "diarsipkan", label: "Diarsipkan" },
];

const klasifikasiOptions = [
  { value: "biasa", label: "Biasa" },
  { value: "penting", label: "Penting" },
  { value: "rahasia", label: "Rahasia" },
];

const tabs = [
  { label: "Surat Masuk", href: "/persuratan" },
  { label: "Surat Keluar", href: "/persuratan/keluar" },
  { label: "Disposisi", href: "/persuratan/disposisi" },
  { label: "Surat Tugas", href: "/persuratan/surat-tugas" },
  { label: "Undangan", href: "/persuratan/undangan" },
  { label: "Template Surat", href: "/persuratan/template" },
  { label: "Buku Agenda", href: "/persuratan/buku-agenda" },
];

const statusVariant: Record<string, "warning" | "info" | "default" | "success" | "danger"> = {
  draft: "warning",
  dikirim: "info",
  diproses: "default",
  selesai: "success",
  diarsipkan: "danger",
};



export default function SuratMasukPage() {
  const pathname = usePathname();
  const [data, setData] = useState<SuratMasuk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search] = useState("");
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<SuratMasuk>({
    id: "", nomor_agenda: "", nomor_surat: "", tanggal_surat: "", tanggal_diterima: "",
    asal_surat: "", perihal: "", klasifikasi: "biasa", status: "draft", catatan: "",
  });

  useEffect(() => {
    fetch("/api/surat?jenis=masuk").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ id: "", nomor_agenda: "", nomor_surat: "", tanggal_surat: "", tanggal_diterima: "", asal_surat: "", perihal: "", klasifikasi: "biasa", status: "draft", catatan: "" });
  };

  const openAdd = () => {
    resetForm();
    setModalMode("add");
  };

  const openEdit = (item: SuratMasuk) => {
    setForm({ ...item });
    setModalMode("edit");
  };

  const openView = (item: SuratMasuk) => {
    setForm({ ...item });
    setModalMode("view");
  };

  async function handleSave() {
    const payload = { ...form, jenis: "masuk" };
    if (modalMode === "edit") {
      const res = await fetch("/api/surat", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: form.id }) });
      if (res.ok) { setData((prev) => prev.map((d) => (d.id === form.id ? { ...payload, id: form.id } : d))); toast.success("Data berhasil diupdate"); }
    } else {
      const res = await fetch("/api/surat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { const newId = String(Date.now()); setData((prev) => [{ ...payload, id: newId }, ...prev]); toast.success("Data berhasil ditambahkan"); }
    }
    setModalMode(null);
  }

  async function handleDelete() {
    if (deleteId) {
      await fetch(`/api/surat?id=${deleteId}`, { method: "DELETE" });
      setData((prev) => prev.filter((d) => d.id !== deleteId));
      setDeleteId(null);
      toast.success("Data berhasil dihapus");
    }
  }

  const filteredData = data.filter(
    (d) =>
      d.nomor_agenda.toLowerCase().includes(search.toLowerCase()) ||
      d.nomor_surat.toLowerCase().includes(search.toLowerCase()) ||
      d.asal_surat.toLowerCase().includes(search.toLowerCase()) ||
      d.perihal.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<SuratMasuk>[] = [
    { header: "No Agenda", accessorKey: "nomor_agenda" },
    { header: "No Surat", accessorKey: "nomor_surat" },
    {
      header: "Tanggal",
      accessorKey: "tanggal_surat",
      cell: ({ row }) => formatDateShort(row.original.tanggal_surat),
    },
    { header: "Asal", accessorKey: "asal_surat" },
    { header: "Perihal", accessorKey: "perihal" },
    {
      header: "Klasifikasi",
      accessorKey: "klasifikasi",
      cell: ({ row }) => <span className="capitalize">{row.original.klasifikasi}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const s = row.original.status;
        const label = statusOptions.find((o) => o.value === s)?.label || s;
        return <Badge variant={statusVariant[s] || "default"}>{label}</Badge>;
      },
    },
    {
      header: "Aksi",
      id: "aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openView(row.original)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Lihat">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(row.original)} className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-600" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-green-50 rounded-lg text-green-600" title="Disposisi">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-600" title="Cetak">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Hapus">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Memuat data surat masuk..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Sub-navigation */}
        <div className="border-b border-gray-200 bg-white rounded-lg shadow-sm px-4">
          <nav className="flex overflow-x-auto gap-6 -mb-px">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Surat Masuk</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola surat masuk yang diterima
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Surat Masuk
          </Button>
        </div>

        {/* Table */}
        <Card>
          {filteredData.length === 0 ? (
            <EmptyState
              title="Belum ada surat masuk"
              message="Tambahkan surat masuk baru untuk memulai."
            />
          ) : (
            <DataTable columns={columns} data={filteredData} searchable={false} />
          )}
        </Card>
      </div>

      {/* Modal Add/Edit */}
      <Modal
        open={modalMode === "add" || modalMode === "edit"}
        onClose={() => { setModalMode(null); resetForm(); }}
        title={modalMode === "add" ? "Tambah Surat Masuk" : "Edit Surat Masuk"}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nomor Agenda" value={form.nomor_agenda} onChange={(e) => setForm({ ...form, nomor_agenda: e.target.value })} />
          <Input label="Nomor Surat" value={form.nomor_surat} onChange={(e) => setForm({ ...form, nomor_surat: e.target.value })} />
          <Input label="Tanggal Surat" type="date" value={form.tanggal_surat} onChange={(e) => setForm({ ...form, tanggal_surat: e.target.value })} />
          <Input label="Tanggal Diterima" type="date" value={form.tanggal_diterima} onChange={(e) => setForm({ ...form, tanggal_diterima: e.target.value })} />
          <Input label="Asal Surat" value={form.asal_surat} onChange={(e) => setForm({ ...form, asal_surat: e.target.value })} />
          <Select label="Klasifikasi" options={klasifikasiOptions} value={form.klasifikasi} onChange={(e) => setForm({ ...form, klasifikasi: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Perihal" value={form.perihal} onChange={(e) => setForm({ ...form, perihal: e.target.value })} />
          </div>
          <Select label="Status" options={statusOptions} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <div className="md:col-span-2">
            <Textarea label="Catatan" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setModalMode(null); resetForm(); }}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </div>
      </Modal>

      {/* Modal View */}
      <Modal open={modalMode === "view"} onClose={() => setModalMode(null)} title="Detail Surat Masuk" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">No Agenda:</span><p className="font-medium">{form.nomor_agenda}</p></div>
            <div><span className="text-gray-500">No Surat:</span><p className="font-medium">{form.nomor_surat}</p></div>
            <div><span className="text-gray-500">Tanggal Surat:</span><p className="font-medium">{form.tanggal_surat}</p></div>
            <div><span className="text-gray-500">Tanggal Diterima:</span><p className="font-medium">{form.tanggal_diterima}</p></div>
            <div><span className="text-gray-500">Asal Surat:</span><p className="font-medium">{form.asal_surat}</p></div>
            <div><span className="text-gray-500">Klasifikasi:</span><p className="font-medium capitalize">{form.klasifikasi}</p></div>
            <div className="col-span-2"><span className="text-gray-500">Perihal:</span><p className="font-medium">{form.perihal}</p></div>
            <div><span className="text-gray-500">Status:</span><p><Badge variant={statusVariant[form.status] || "default"}>{statusOptions.find((o) => o.value === form.status)?.label || form.status}</Badge></p></div>
          </div>
          {form.catatan && (
            <div className="text-sm"><span className="text-gray-500">Catatan:</span><p className="mt-1 text-gray-700">{form.catatan}</p></div>
          )}
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setModalMode(null)}>Tutup</Button>
        </div>
      </Modal>

      {/* Modal Delete */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus surat ini? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
