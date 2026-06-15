"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Pencil, Printer, Trash2, CheckCircle, XCircle } from "lucide-react";
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

type Undangan = {
  id: string;
  nomor_undangan: string;
  tanggal: string;
  pengirim: string;
  perihal: string;
  acara: string;
  tempat: string;
  waktu: string;
  peserta: string;
  status: string;
  catatan: string;
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "dikirim", label: "Dikirim" },
  { value: "dikonfirmasi", label: "Dikonfirmasi" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

const statusVariant: Record<string, "warning" | "info" | "default" | "success" | "danger"> = {
  draft: "warning",
  dikirim: "info",
  dikonfirmasi: "default",
  selesai: "success",
  dibatalkan: "danger",
};

const tabs = [
  { label: "Surat Masuk", href: "/persuratan" },
  { label: "Surat Keluar", href: "/persuratan/keluar" },
  { label: "Disposisi", href: "/persuratan/disposisi" },
  { label: "Surat Tugas", href: "/persuratan/surat-tugas" },
  { label: "Undangan", href: "/persuratan/undangan" },
  { label: "Template Surat", href: "/persuratan/template" },
  { label: "Buku Agenda", href: "/persuratan/buku-agenda" },
];

const demoData: Undangan[] = [
  { id: "1", nomor_undangan: "421/101/Disdik", tanggal: "2026-06-10", pengirim: "Dinas Pendidikan", perihal: "Rapat Koordinasi Bidang SD", acara: "Rapat Koordinasi", tempat: "Aula Dinas Pendidikan", waktu: "09:00", peserta: "Kepala Bidang SD, Staf Bidang SD", status: "dikirim", catatan: "" },
  { id: "2", nomor_undangan: "422/55/BPS", tanggal: "2026-06-12", pengirim: "BPS Kabupaten", perihal: "Sosialisasi Pendataan", acara: "Sosialisasi", tempat: "Gedung BPS", waktu: "08:30", peserta: "Staf Data GTK", status: "dikonfirmasi", catatan: "Konfirmasi sudah diterima" },
  { id: "3", nomor_undangan: "423/20/Kemendikbud", tanggal: "2026-06-15", pengirim: "Kemendikbud", perihal: "Bimtek SPMB", acara: "Bimbingan Teknis", tempat: "Hotel Grand", waktu: "07:30", peserta: "Kepala Bidang SD", status: "selesai", catatan: "Sudah dilaksanakan" },
  { id: "4", nomor_undangan: "424/33/BPMP", tanggal: "2026-06-18", pengirim: "BPMP Provinsi", perihal: "Monitoring dan Evaluasi", acara: "Monev", tempat: "Kantor BPMP", waktu: "09:00", peserta: "Tim Monitoring", status: "draft", catatan: "" },
  { id: "5", nomor_undangan: "425/12/Disdik", tanggal: "2026-06-20", pengirim: "Dinas Pendidikan", perihal: "Halal Bihalal", acara: "Halal Bihalal", tempat: "Halaman Kantor", waktu: "08:00", peserta: "Seluruh Staf", status: "dibatalkan", catatan: "Dibatalkan karena bencana" },
];

export default function UndanganPage() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [data, setData] = useState<Undangan[]>(demoData);
  const [loading] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Undangan>({
    id: "", nomor_undangan: "", tanggal: "", pengirim: "", perihal: "", acara: "",
    tempat: "", waktu: "", peserta: "", status: "draft", catatan: "",
  });

  const resetForm = () => {
    setForm({ id: "", nomor_undangan: "", tanggal: "", pengirim: "", perihal: "", acara: "", tempat: "", waktu: "", peserta: "", status: "draft", catatan: "" });
  };

  const openAdd = () => { resetForm(); setModalMode("add"); };
  const openEdit = (item: Undangan) => { setForm({ ...item }); setModalMode("edit"); };
  const openView = (item: Undangan) => { setForm({ ...item }); setModalMode("view"); };

  const handleSave = () => {
    if (modalMode === "add") {
      setData((prev) => [{ ...form, id: String(Date.now()) }, ...prev]);
    } else if (modalMode === "edit") {
      setData((prev) => prev.map((d) => (d.id === form.id ? form : d)));
    }
    setModalMode(null);
    resetForm();
  };

  const handleDelete = () => {
    if (deleteId) {
      setData((prev) => prev.filter((d) => d.id !== deleteId));
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Undangan>[] = [
    { header: "No Undangan", accessorKey: "nomor_undangan" },
    { header: "Tanggal", accessorKey: "tanggal", cell: ({ row }) => formatDateShort(row.original.tanggal) },
    { header: "Pengirim", accessorKey: "pengirim" },
    { header: "Perihal", accessorKey: "perihal" },
    { header: "Acara", accessorKey: "acara" },
    { header: "Tempat", accessorKey: "tempat" },
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
          <button onClick={() => openView(row.original)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Lihat"><Eye className="w-4 h-4" /></button>
          <button onClick={() => openEdit(row.original)} className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-600" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button className="p-1.5 hover:bg-green-50 rounded-lg text-green-600" title="Konfirmasi"><CheckCircle className="w-4 h-4" /></button>
          <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-600" title="Cetak"><Printer className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Memuat data undangan..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="border-b border-gray-200 bg-white rounded-lg shadow-sm px-4">
          <nav className="flex overflow-x-auto gap-6 -mb-px">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  pathname === tab.href
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Undangan</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola undangan rapat dan acara</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Undangan
          </Button>
        </div>

        <Card>
          {data.length === 0 ? (
            <EmptyState title="Belum ada undangan" message="Tambahkan undangan baru untuk memulai." />
          ) : (
            <DataTable columns={columns} data={data} searchable />
          )}
        </Card>
      </div>

      <Modal open={modalMode === "add" || modalMode === "edit"} onClose={() => { setModalMode(null); resetForm(); }} title={modalMode === "add" ? "Tambah Undangan" : "Edit Undangan"} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nomor Undangan" value={form.nomor_undangan} onChange={(e) => setForm({ ...form, nomor_undangan: e.target.value })} />
          <Input label="Tanggal" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          <Input label="Pengirim" value={form.pengirim} onChange={(e) => setForm({ ...form, pengirim: e.target.value })} />
          <Input label="Acara" value={form.acara} onChange={(e) => setForm({ ...form, acara: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Perihal" value={form.perihal} onChange={(e) => setForm({ ...form, perihal: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Input label="Tempat" value={form.tempat} onChange={(e) => setForm({ ...form, tempat: e.target.value })} />
          </div>
          <Input label="Waktu" type="time" value={form.waktu} onChange={(e) => setForm({ ...form, waktu: e.target.value })} />
          <Select label="Status" options={statusOptions} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Peserta" value={form.peserta} onChange={(e) => setForm({ ...form, peserta: e.target.value })} placeholder="Pisahkan dengan koma" />
          </div>
          <div className="md:col-span-2">
            <Textarea label="Catatan" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setModalMode(null); resetForm(); }}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </div>
      </Modal>

      <Modal open={modalMode === "view"} onClose={() => setModalMode(null)} title="Detail Undangan" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">No Undangan:</span><p className="font-medium">{form.nomor_undangan}</p></div>
            <div><span className="text-gray-500">Tanggal:</span><p className="font-medium">{form.tanggal}</p></div>
            <div><span className="text-gray-500">Pengirim:</span><p className="font-medium">{form.pengirim}</p></div>
            <div><span className="text-gray-500">Acara:</span><p className="font-medium">{form.acara}</p></div>
            <div className="col-span-2"><span className="text-gray-500">Perihal:</span><p className="font-medium">{form.perihal}</p></div>
            <div className="col-span-2"><span className="text-gray-500">Tempat:</span><p className="font-medium">{form.tempat}</p></div>
            <div><span className="text-gray-500">Waktu:</span><p className="font-medium">{form.waktu}</p></div>
            <div><span className="text-gray-500">Status:</span><p><Badge variant={statusVariant[form.status] || "default"}>{statusOptions.find((o) => o.value === form.status)?.label || form.status}</Badge></p></div>
            {form.peserta && <div className="col-span-2"><span className="text-gray-500">Peserta:</span><p className="font-medium">{form.peserta}</p></div>}
          </div>
          {form.catatan && <div className="text-sm"><span className="text-gray-500">Catatan:</span><p className="mt-1 text-gray-700">{form.catatan}</p></div>}
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setModalMode(null)}>Tutup</Button>
        </div>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus undangan ini? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
