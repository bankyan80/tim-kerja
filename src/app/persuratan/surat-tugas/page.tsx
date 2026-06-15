"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Pencil, Printer, Trash2, FileDown } from "lucide-react";
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

type SuratTugas = {
  id: string;
  nomor_surat: string;
  tanggal: string;
  tujuan: string;
  perihal: string;
  dasar: string;
  penandatangan: string;
  isi_tugas: string;
  lampiran: string;
  status: string;
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "diterbitkan", label: "Diterbitkan" },
  { value: "selesai", label: "Selesai" },
  { value: "diarsipkan", label: "Diarsipkan" },
];

const statusVariant: Record<string, "warning" | "info" | "default" | "success" | "danger"> = {
  draft: "warning",
  diterbitkan: "info",
  selesai: "success",
  diarsipkan: "danger",
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

const demoData: SuratTugas[] = [
  { id: "1", nomor_surat: "800/101/Bid.SD", tanggal: "2026-06-01", tujuan: "Ani Rahmawati, S.Pd.", perihal: "Supervisi SDN 1 Lemahabang", dasar: "Program Kerja Bidang SD", penandatangan: "Kepala Dinas", isi_tugas: "Melaksanakan supervisi akademik di SDN 1 Lemahabang", lampiran: "", status: "diterbitkan" },
  { id: "2", nomor_surat: "800/102/Bid.SD", tanggal: "2026-06-03", tujuan: "Budi Santoso, S.Pd.", perihal: "Bimtek Kurikulum Merdeka", dasar: "Undangan Bimtek dari Disdik", penandatangan: "Kepala Bidang SD", isi_tugas: "Mengikuti Bimtek Kurikulum Merdeka", lampiran: "undangan_bimtek.pdf", status: "selesai" },
  { id: "3", nomor_surat: "800/103/Bid.SD", tanggal: "2026-06-05", tujuan: "Citra Dewi, S.Pd.", perihal: "Verifikasi Data GTK", dasar: "Instruksi Kepala Dinas", penandatangan: "Kepala Dinas", isi_tugas: "Verifikasi data GTK di 10 sekolah", lampiran: "", status: "draft" },
  { id: "4", nomor_surat: "800/104/Bid.SD", tanggal: "2026-06-08", tujuan: "Dedi Kurniawan", perihal: "Monitoring SPMB", dasar: "Keputusan Kepala Dinas", penandatangan: "Kepala Dinas", isi_tugas: "Monitoring pelaksanaan SPMB di kecamatan", lampiran: "", status: "diarsipkan" },
];

export default function SuratTugasPage() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [data, setData] = useState<SuratTugas[]>(demoData);
  const [loading] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<SuratTugas>({
    id: "", nomor_surat: "", tanggal: "", tujuan: "", perihal: "", dasar: "",
    penandatangan: "", isi_tugas: "", lampiran: "", status: "draft",
  });

  const resetForm = () => {
    setForm({ id: "", nomor_surat: "", tanggal: "", tujuan: "", perihal: "", dasar: "", penandatangan: "", isi_tugas: "", lampiran: "", status: "draft" });
  };

  const openAdd = () => { resetForm(); setModalMode("add"); };
  const openEdit = (item: SuratTugas) => { setForm({ ...item }); setModalMode("edit"); };
  const openView = (item: SuratTugas) => { setForm({ ...item }); setModalMode("view"); };

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

  const columns: ColumnDef<SuratTugas>[] = [
    { header: "No Surat", accessorKey: "nomor_surat" },
    { header: "Tanggal", accessorKey: "tanggal", cell: ({ row }) => formatDateShort(row.original.tanggal) },
    { header: "Tujuan", accessorKey: "tujuan" },
    { header: "Perihal", accessorKey: "perihal" },
    { header: "Penandatangan", accessorKey: "penandatangan" },
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
          <button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Unduh"><FileDown className="w-4 h-4" /></button>
          <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-600" title="Cetak"><Printer className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Memuat data surat tugas..." />;

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
            <h1 className="text-2xl font-bold text-gray-900">Surat Tugas</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola surat tugas untuk staf</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Surat Tugas
          </Button>
        </div>

        <Card>
          {data.length === 0 ? (
            <EmptyState title="Belum ada surat tugas" message="Tambahkan surat tugas baru untuk memulai." />
          ) : (
            <DataTable columns={columns} data={data} searchable />
          )}
        </Card>
      </div>

      <Modal open={modalMode === "add" || modalMode === "edit"} onClose={() => { setModalMode(null); resetForm(); }} title={modalMode === "add" ? "Tambah Surat Tugas" : "Edit Surat Tugas"} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nomor Surat" value={form.nomor_surat} onChange={(e) => setForm({ ...form, nomor_surat: e.target.value })} />
          <Input label="Tanggal" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          <Input label="Tujuan" value={form.tujuan} onChange={(e) => setForm({ ...form, tujuan: e.target.value })} />
          <Input label="Penandatangan" value={form.penandatangan} onChange={(e) => setForm({ ...form, penandatangan: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Perihal" value={form.perihal} onChange={(e) => setForm({ ...form, perihal: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Textarea label="Dasar" value={form.dasar} onChange={(e) => setForm({ ...form, dasar: e.target.value })} rows={2} />
          </div>
          <div className="md:col-span-2">
            <Textarea label="Isi Tugas" value={form.isi_tugas} onChange={(e) => setForm({ ...form, isi_tugas: e.target.value })} rows={4} />
          </div>
          <Select label="Status" options={statusOptions} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Lampiran" value={form.lampiran} onChange={(e) => setForm({ ...form, lampiran: e.target.value })} placeholder="Nama file lampiran" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setModalMode(null); resetForm(); }}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </div>
      </Modal>

      <Modal open={modalMode === "view"} onClose={() => setModalMode(null)} title="Detail Surat Tugas" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">No Surat:</span><p className="font-medium">{form.nomor_surat}</p></div>
            <div><span className="text-gray-500">Tanggal:</span><p className="font-medium">{form.tanggal}</p></div>
            <div><span className="text-gray-500">Tujuan:</span><p className="font-medium">{form.tujuan}</p></div>
            <div><span className="text-gray-500">Penandatangan:</span><p className="font-medium">{form.penandatangan}</p></div>
            <div className="col-span-2"><span className="text-gray-500">Perihal:</span><p className="font-medium">{form.perihal}</p></div>
            {form.dasar && <div className="col-span-2"><span className="text-gray-500">Dasar:</span><p className="mt-1 text-gray-700">{form.dasar}</p></div>}
            {form.isi_tugas && <div className="col-span-2"><span className="text-gray-500">Isi Tugas:</span><p className="mt-1 text-gray-700 whitespace-pre-wrap">{form.isi_tugas}</p></div>}
            <div><span className="text-gray-500">Status:</span><p><Badge variant={statusVariant[form.status] || "default"}>{statusOptions.find((o) => o.value === form.status)?.label || form.status}</Badge></p></div>
          </div>
          {form.lampiran && <div className="text-sm"><span className="text-gray-500">Lampiran:</span><p className="font-medium">{form.lampiran}</p></div>}
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setModalMode(null)}>Tutup</Button>
        </div>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus surat tugas ini? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
