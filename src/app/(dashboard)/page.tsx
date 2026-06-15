"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  Mail,
  FileText,
  Calendar,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { formatDate, getTahunPelajaran } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";

// --- dummy data ---

const summaryData = [
  { label: "Jumlah Sekolah", value: 24, icon: School },
  { label: "Jumlah Siswa", value: 3842, icon: Users },
  { label: "Jumlah GTK", value: 289, icon: GraduationCap },
  { label: "Surat Belum Diproses", value: 7, icon: Mail },
];

const progressData = [
  { label: "Laporan Bulanan", selesai: 18, belum: 4, perbaikan: 2 },
  { label: "Pembaruan Data Sekolah", selesai: 22, belum: 1, perbaikan: 1 },
  { label: "Validasi Data GTK", selesai: 15, belum: 7, perbaikan: 2 },
  { label: "Pembaruan Data Siswa", selesai: 20, belum: 3, perbaikan: 1 },
  { label: "Pembaruan Sarpras", selesai: 10, belum: 10, perbaikan: 4 },
  { label: "Pendataan SPMB", selesai: 24, belum: 0, perbaikan: 0 },
  { label: "Monitoring Sekolah", selesai: 12, belum: 8, perbaikan: 4 },
  { label: "Pengumpulan Dokumen", selesai: 14, belum: 6, perbaikan: 4 },
];

const tindakLanjutData = [
  { item: "Verifikasi laporan bulanan SDN 1 Lemahabang", status: "Urgent" },
  { item: "Validasi data GTK baru", status: "Baru" },
  { item: "Periksa kelengkapan dokumen SPMB", status: "Pending" },
  { item: "Konfirmasi data sarpras SDN 2 Lemahabang", status: "Urgent" },
];

const suratMasukData = [
  { perihal: "Undangan Rapat Koordinasi", dari: "Dinas Pendidikan" },
  { perihal: "Surat Edaran SPMB 2025/2026", dari: "Kemendikbud" },
  { perihal: "Permohonan Data GTK", dari: "BPS Kabupaten" },
];

const agendaData = [
  { acara: "Rapat Koordinasi Bidang SD", tanggal: "2026-06-18", waktu: "09:00" },
  { acara: "Supervisi SDN 3 Lemahabang", tanggal: "2026-06-20", waktu: "08:00" },
  { acara: "Bimtek SPMB", tanggal: "2026-06-25", waktu: "07:30" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loading message="Memuat dashboard..." />;

  const today = formatDate(new Date());
  const tahunPelajaran = getTahunPelajaran();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ---- Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Staf Bidang SD</h1>
            <p className="text-sm text-gray-500 mt-1">
              {today} &middot; Tahun Pelajaran {tahunPelajaran}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/data-sekolah"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Tambah Data
            </Link>
            <Link
              href="/persuratan"
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Buat Surat
            </Link>
          </div>
        </div>

        {/* ---- Summary Cards ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryData.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{item.value.toLocaleString("id-ID")}</p>
                    <p className="text-sm text-gray-500">{item.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* ---- Progress Panel ---- */}
        <Card>
          <CardHeader>
            <CardTitle>Progres Pengumpulan Data</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium px-2 text-center">Selesai</th>
                  <th className="pb-3 font-medium px-2 text-center">Belum</th>
                  <th className="pb-3 font-medium px-2 text-center">Perbaikan</th>
                  <th className="pb-3 font-medium px-4 text-center">Progres</th>
                  <th className="pb-3 font-medium text-center"></th>
                </tr>
              </thead>
              <tbody>
                {progressData.map((row) => {
                  const total = row.selesai + row.belum + row.perbaikan;
                  const pct = total > 0 ? Math.round((row.selesai / total) * 100) : 0;
                  return (
                    <tr key={row.label} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-gray-800 font-medium">{row.label}</td>
                      <td className="py-3 px-2 text-center text-green-600 font-semibold">{row.selesai}</td>
                      <td className="py-3 px-2 text-center text-gray-500">{row.belum}</td>
                      <td className="py-3 px-2 text-center text-yellow-600">{row.perbaikan}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <Link
                          href="#"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          Rincian
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ---- Bottom Section ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Perlu Ditindaklanjuti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                Perlu Ditindaklanjuti
              </CardTitle>
            </CardHeader>
            {tindakLanjutData.length === 0 ? (
              <EmptyState title="Tidak ada" message="Semua data sudah ditindaklanjuti." />
            ) : (
              <ul className="space-y-3">
                {tindakLanjutData.map((item) => (
                  <li key={item.item} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${item.status === "Urgent" ? "bg-red-500" : "bg-blue-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 truncate">{item.item}</p>
                      <Badge variant={item.status === "Urgent" ? "danger" : "info"}>{item.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/lainnya"
              className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat semua
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Card>

          {/* Surat Masuk Terbaru */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                Surat Masuk Terbaru
              </CardTitle>
            </CardHeader>
            {suratMasukData.length === 0 ? (
              <EmptyState title="Tidak ada surat" message="Belum ada surat masuk." />
            ) : (
              <ul className="space-y-3">
                {suratMasukData.map((surat) => (
                  <li key={surat.perihal} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-gray-800">{surat.perihal}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Dari: {surat.dari}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/persuratan"
              className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat semua
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Card>

          {/* Agenda Terdekat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Agenda Terdekat
              </CardTitle>
            </CardHeader>
            {agendaData.length === 0 ? (
              <EmptyState title="Tidak ada agenda" message="Belum ada agenda terdekat." />
            ) : (
              <ul className="space-y-3">
                {agendaData.map((agenda) => (
                  <li key={agenda.acara} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <span className="text-[10px] leading-tight font-bold uppercase">
                        {formatDate(agenda.tanggal, "MMM")}
                      </span>
                      <span className="text-sm leading-tight font-bold">
                        {formatDate(agenda.tanggal, "dd")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">{agenda.acara}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{agenda.waktu}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/kegiatan"
              className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat semua
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Card>

        </div>
      </div>
    </div>
  );
}
