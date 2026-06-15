"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  Printer,
  FileDown,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const tabs = [
  "Data Sekolah",
  "Data Siswa",
  "Data GTK",
  "Mapping Pegawai",
  "Laporan Bulanan",
  "Sarpras",
  "SPMB",
  "Surat",
  "Kegiatan",
  "Monitoring",
  "Progres Pengumpulan Data",
] as const;

type Tab = (typeof tabs)[number];

const tahunPelajaranOptions = [
  "2024/2025",
  "2025/2026",
  "2026/2027",
];

const sekolahNama: string[] = [];

// --- Data per kategori ---

const dataSekolah = [
  { label: "Total Sekolah", value: 6, variant: "info" as const },
  { label: "Negeri", value: 4, variant: "success" as const },
  { label: "Swasta", value: 2, variant: "warning" as const },
  { label: "Aktif", value: 5, variant: "success" as const },
  { label: "Nonaktif", value: 1, variant: "danger" as const },
  { label: "Terakreditasi A", value: 3, variant: "success" as const },
  { label: "Terakreditasi B", value: 2, variant: "warning" as const },
  { label: "Belum Akreditasi", value: 1, variant: "default" as const },
];

const dataSiswa = {
  total: 1850,
  laki: 945,
  perempuan: 905,
  perKelas: [
    { kelas: "Kelas 1", jumlah: 310 },
    { kelas: "Kelas 2", jumlah: 295 },
    { kelas: "Kelas 3", jumlah: 305 },
    { kelas: "Kelas 4", jumlah: 290 },
    { kelas: "Kelas 5", jumlah: 325 },
    { kelas: "Kelas 6", jumlah: 325 },
  ],
};

const dataGTK = {
  total: 96,
  pns: 42,
  nonPns: 38,
  honorer: 16,
  perSekolah: [
    { sekolah: "SD Negeri 1 Lemahabang", total: 18, pns: 10, nonPns: 6, honorer: 2 },
    { sekolah: "SD Negeri 2 Lemahabang", total: 16, pns: 9, nonPns: 5, honorer: 2 },
    { sekolah: "SD Negeri 3 Lemahabang", total: 15, pns: 8, nonPns: 5, honorer: 2 },
    { sekolah: "SD Negeri 4 Lemahabang", total: 12, pns: 5, nonPns: 4, honorer: 3 },
    { sekolah: "MI Al-Ihsan Lemahabang", total: 20, pns: 6, nonPns: 10, honorer: 4 },
    { sekolah: "SD IT Bina Cendekia", total: 15, pns: 4, nonPns: 8, honorer: 3 },
  ],
};

const mappingPegawai = [
  { sekolah: "SD Negeri 1 Lemahabang", kepala_sekolah: "Drs. Ahmad Suherman", operator: "Rudi Hartono", guru: 14, staf: 2 },
  { sekolah: "SD Negeri 2 Lemahabang", kepala_sekolah: "Hj. Siti Maryam, S.Pd.", operator: "Agus Wahyudi", guru: 12, staf: 2 },
  { sekolah: "SD Negeri 3 Lemahabang", kepala_sekolah: "Drs. H. Edi Sumantri", operator: "Dede Kurniawan", guru: 11, staf: 2 },
  { sekolah: "SD Negeri 4 Lemahabang", kepala_sekolah: "Ibu Yuniarti, S.Pd.", operator: "Fajar Nugraha", guru: 9, staf: 1 },
  { sekolah: "MI Al-Ihsan Lemahabang", kepala_sekolah: "K. Ahmad Fauzi, S.Ag.", operator: "Muhammad Rizki", guru: 16, staf: 2 },
  { sekolah: "SD IT Bina Cendekia", kepala_sekolah: "Dra. Hj. Nurhayati", operator: "Indra Lesmana", guru: 11, staf: 2 },
];

const laporanBulanan = [
  { bulan: "Januari", sd1: true, sd2: true, sd3: true, sd4: true, mi: true, sdIt: true },
  { bulan: "Februari", sd1: true, sd2: true, sd3: true, sd4: true, mi: true, sdIt: true },
  { bulan: "Maret", sd1: true, sd2: true, sd3: true, sd4: false, mi: true, sdIt: true },
  { bulan: "April", sd1: true, sd2: true, sd3: true, sd4: true, mi: true, sdIt: false },
  { bulan: "Mei", sd1: true, sd2: true, sd3: false, sd4: true, mi: true, sdIt: true },
  { bulan: "Juni", sd1: true, sd2: true, sd3: true, sd4: true, mi: false, sdIt: true },
];

const sarpras = {
  totalRuang: 145,
  kondisiBaik: 98,
  kondisiSedang: 32,
  kondisiRusak: 15,
  perJenis: [
    { jenis: "Ruang Kelas", jumlah: 48, baik: 36, sedang: 9, rusak: 3 },
    { jenis: "Perpustakaan", jumlah: 6, baik: 4, sedang: 1, rusak: 1 },
    { jenis: "UKS", jumlah: 6, baik: 5, sedang: 1, rusak: 0 },
    { jenis: "Toilet", jumlah: 24, baik: 16, sedang: 5, rusak: 3 },
    { jenis: "Mushola", jumlah: 6, baik: 5, sedang: 1, rusak: 0 },
    { jenis: "Ruang Guru", jumlah: 6, baik: 4, sedang: 2, rusak: 0 },
    { jenis: "Ruang Kepala Sekolah", jumlah: 6, baik: 5, sedang: 1, rusak: 0 },
    { jenis: "Meubelair", jumlah: 360, baik: 280, sedang: 55, rusak: 25 },
    { jenis: "Rumah Dinas", jumlah: 6, baik: 4, sedang: 2, rusak: 0 },
    { jenis: "Gudang", jumlah: 6, baik: 3, sedang: 2, rusak: 1 },
  ],
};

const spmb = {
  totalPendaftar: 420,
  diterima: 380,
  cadangan: 30,
  mengundurkanDiri: 10,
  perSekolah: [
    { sekolah: "SD Negeri 1 Lemahabang", pendaftar: 85, diterima: 80, cadangan: 5, mengundur: 3 },
    { sekolah: "SD Negeri 2 Lemahabang", pendaftar: 76, diterima: 70, cadangan: 6, mengundur: 2 },
    { sekolah: "SD Negeri 3 Lemahabang", pendaftar: 65, diterima: 60, cadangan: 5, mengundur: 1 },
    { sekolah: "SD Negeri 4 Lemahabang", pendaftar: 42, diterima: 35, cadangan: 7, mengundur: 0 },
    { sekolah: "MI Al-Ihsan Lemahabang", pendaftar: 90, diterima: 80, cadangan: 5, mengundur: 3 },
    { sekolah: "SD IT Bina Cendekia", pendaftar: 62, diterima: 55, cadangan: 2, mengundur: 1 },
  ],
};

const surat = {
  total: 245,
  masuk: 89,
  keluar: 156,
  disposisi: 72,
  perBulan: [
    { bulan: "Januari", masuk: 12, keluar: 18 },
    { bulan: "Februari", masuk: 8, keluar: 15 },
    { bulan: "Maret", masuk: 14, keluar: 20 },
    { bulan: "April", masuk: 10, keluar: 16 },
    { bulan: "Mei", masuk: 9, keluar: 14 },
    { bulan: "Juni", masuk: 7, keluar: 12 },
  ],
};

const kegiatan = {
  total: 48,
  terlaksana: 42,
  belum: 6,
  perSekolah: [
    { sekolah: "SD Negeri 1 Lemahabang", total: 10, terlaksana: 9 },
    { sekolah: "SD Negeri 2 Lemahabang", total: 8, terlaksana: 7 },
    { sekolah: "SD Negeri 3 Lemahabang", total: 7, terlaksana: 6 },
    { sekolah: "SD Negeri 4 Lemahabang", total: 5, terlaksana: 4 },
    { sekolah: "MI Al-Ihsan Lemahabang", total: 11, terlaksana: 10 },
    { sekolah: "SD IT Bina Cendekia", total: 7, terlaksana: 6 },
  ],
};

const monitoring = {
  total: 8,
  tertunda: 2,
  ditindaklanjuti: 2,
  selesai: 4,
  perSekolah: [
    { sekolah: "SD Negeri 1 Lemahabang", total: 2, selesai: 2 },
    { sekolah: "SD Negeri 2 Lemahabang", total: 2, selesai: 1, ditindaklanjuti: 1 },
    { sekolah: "SD Negeri 3 Lemahabang", total: 1, tertunda: 1 },
    { sekolah: "SD Negeri 4 Lemahabang", total: 1, selesai: 1 },
    { sekolah: "MI Al-Ihsan Lemahabang", total: 1, ditindaklanjuti: 1 },
    { sekolah: "SD IT Bina Cendekia", total: 1, selesai: 1 },
  ],
};

const progresData = [
  { kategori: "Data Sekolah", persentase: 100, status: "lengkap" as const },
  { kategori: "Data Siswa", persentase: 100, status: "lengkap" as const },
  { kategori: "Data GTK", persentase: 95, status: "hampir" as const },
  { kategori: "Mapping Pegawai", persentase: 100, status: "lengkap" as const },
  { kategori: "Laporan Bulanan", persentase: 83, status: "hampir" as const },
  { kategori: "Sarpras", persentase: 90, status: "hampir" as const },
  { kategori: "SPMB", persentase: 100, status: "lengkap" as const },
  { kategori: "Surat", persentase: 100, status: "lengkap" as const },
  { kategori: "Kegiatan", persentase: 88, status: "hampir" as const },
  { kategori: "Monitoring", persentase: 75, status: "kurang" as const },
];

export default function RekapPage() {
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Data Sekolah");
  const [tahunPelajaran, setTahunPelajaran] = useState("2025/2026");

  const overallProgress = Math.round(
    progresData.reduce((sum, p) => sum + p.persentase, 0) / progresData.length
  );

  if (loading) return <Loading message="Memuat data rekap..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rekap Kecamatan</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kecamatan Lemahabang</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={tahunPelajaran}
              onChange={(e) => setTahunPelajaran(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tahunPelajaranOptions.map((tp) => (
                <option key={tp} value={tp}>{tp}</option>
              ))}
            </select>
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Cetak PDF
            </Button>
            <Button variant="outline">
              <FileDown className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Sekolah</p>
              <p className="text-2xl font-bold text-blue-600">6</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Siswa</p>
              <p className="text-2xl font-bold text-green-600">1.850</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total GTK</p>
              <p className="text-2xl font-bold text-purple-600">96</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Progres Data</p>
              <p className="text-2xl font-bold text-orange-600">{overallProgress}%</p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>{activeTab}</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === "Data Sekolah" && <DataSekolahTab />}
            {activeTab === "Data Siswa" && <DataSiswaTab />}
            {activeTab === "Data GTK" && <DataGTKTab />}
            {activeTab === "Mapping Pegawai" && <MappingPegawaiTab />}
            {activeTab === "Laporan Bulanan" && <LaporanBulananTab />}
            {activeTab === "Sarpras" && <SarprasTab />}
            {activeTab === "SPMB" && <SPMBTab />}
            {activeTab === "Surat" && <SuratTab />}
            {activeTab === "Kegiatan" && <KegiatanTab />}
            {activeTab === "Monitoring" && <MonitoringTab />}
            {activeTab === "Progres Pengumpulan Data" && <ProgresTab />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, variant }: { label: string; value: number; variant: "info" | "success" | "warning" | "danger" | "default" }) {
  const colors = {
    info: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
    default: "text-gray-600",
  };
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <Badge variant={variant} className="mt-1">{label}</Badge>
    </div>
  );
}

function TabTable({ headers, rows }: { headers: string[]; rows: (string | number | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DataSekolahTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {dataSekolah.map((d) => (
          <StatCard key={d.label} {...d} />
        ))}
      </div>
    </div>
  );
}

function DataSiswaTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Siswa" value={dataSiswa.total} variant="info" />
        <StatCard label="Laki-laki" value={dataSiswa.laki} variant="info" />
        <StatCard label="Perempuan" value={dataSiswa.perempuan} variant="info" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Jumlah Siswa per Kelas</h4>
        <TabTable
          headers={["Kelas", "Jumlah"]}
          rows={dataSiswa.perKelas.map((k) => [k.kelas, k.jumlah])}
        />
      </div>
    </div>
  );
}

function DataGTKTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total GTK" value={dataGTK.total} variant="info" />
        <StatCard label="PNS" value={dataGTK.pns} variant="success" />
        <StatCard label="Non PNS" value={dataGTK.nonPns} variant="warning" />
        <StatCard label="Honorer" value={dataGTK.honorer} variant="default" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">GTK per Sekolah</h4>
        <TabTable
          headers={["Sekolah", "Total", "PNS", "Non PNS", "Honorer"]}
          rows={dataGTK.perSekolah.map((s) => [s.sekolah, s.total, s.pns, s.nonPns, s.honorer])}
        />
      </div>
    </div>
  );
}

function MappingPegawaiTab() {
  return (
    <div>
      <TabTable
        headers={["Sekolah", "Kepala Sekolah", "Operator", "Jumlah Guru", "Staf TU"]}
        rows={mappingPegawai.map((m) => [m.sekolah, m.kepala_sekolah, m.operator, m.guru, m.staf])}
      />
    </div>
  );
}

function LaporanBulananTab() {
  const sekolahSingkat = ["SDN 1", "SDN 2", "SDN 3", "SDN 4", "MI", "SD IT"];
  const checkKey = ["sd1", "sd2", "sd3", "sd4", "mi", "sdIt"] as const;
  return (
    <div>
      <TabTable
        headers={["Bulan", ...sekolahSingkat]}
        rows={laporanBulanan.map((l) => [
          l.bulan,
          ...checkKey.map((k) =>
            l[k] ? (
              <span key={k} className="text-green-600 font-medium">&#10003;</span>
            ) : (
              <span key={k} className="text-red-600 font-medium">&#10007;</span>
            )
          ),
        ])}
      />
    </div>
  );
}

function SarprasTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sarpras" value={sarpras.totalRuang} variant="info" />
        <StatCard label="Kondisi Baik" value={sarpras.kondisiBaik} variant="success" />
        <StatCard label="Kondisi Sedang" value={sarpras.kondisiSedang} variant="warning" />
        <StatCard label="Kondisi Rusak" value={sarpras.kondisiRusak} variant="danger" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Rekapitulasi per Jenis</h4>
        <TabTable
          headers={["Jenis Sarpras", "Jumlah", "Baik", "Sedang", "Rusak"]}
          rows={sarpras.perJenis.map((j) => [j.jenis, j.jumlah, j.baik, j.sedang, j.rusak])}
        />
      </div>
    </div>
  );
}

function SPMBTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pendaftar" value={spmb.totalPendaftar} variant="info" />
        <StatCard label="Diterima" value={spmb.diterima} variant="success" />
        <StatCard label="Cadangan" value={spmb.cadangan} variant="warning" />
        <StatCard label="Mengundurkan Diri" value={spmb.mengundurkanDiri} variant="danger" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Per Sekolah</h4>
        <TabTable
          headers={["Sekolah", "Pendaftar", "Diterima", "Cadangan", "Mengundurkan Diri"]}
          rows={spmb.perSekolah.map((s) => [s.sekolah, s.pendaftar, s.diterima, s.cadangan, s.mengundur])}
        />
      </div>
    </div>
  );
}

function SuratTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Surat" value={surat.total} variant="info" />
        <StatCard label="Surat Masuk" value={surat.masuk} variant="success" />
        <StatCard label="Surat Keluar" value={surat.keluar} variant="warning" />
        <StatCard label="Disposisi" value={surat.disposisi} variant="default" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Per Bulan</h4>
        <TabTable
          headers={["Bulan", "Surat Masuk", "Surat Keluar"]}
          rows={surat.perBulan.map((b) => [b.bulan, b.masuk, b.keluar])}
        />
      </div>
    </div>
  );
}

function KegiatanTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Kegiatan" value={kegiatan.total} variant="info" />
        <StatCard label="Terlaksana" value={kegiatan.terlaksana} variant="success" />
        <StatCard label="Belum Terlaksana" value={kegiatan.belum} variant="danger" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Per Sekolah</h4>
        <TabTable
          headers={["Sekolah", "Total", "Terlaksana", "Belum"]}
          rows={kegiatan.perSekolah.map((s) => [s.sekolah, s.total, s.terlaksana, s.total - s.terlaksana])}
        />
      </div>
    </div>
  );
}

function MonitoringTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Monitoring" value={monitoring.total} variant="info" />
        <StatCard label="Selesai" value={monitoring.selesai} variant="success" />
        <StatCard label="Ditindaklanjuti" value={monitoring.ditindaklanjuti} variant="warning" />
        <StatCard label="Tertunda" value={monitoring.tertunda} variant="danger" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Per Sekolah</h4>
        <TabTable
          headers={["Sekolah", "Total", "Selesai", "Ditindaklanjuti", "Tertunda"]}
          rows={monitoring.perSekolah.map((s) => [
            s.sekolah,
            s.total,
            s.selesai || 0,
            s.ditindaklanjuti || 0,
            s.tertunda || 0,
          ])}
        />
      </div>
    </div>
  );
}

function ProgresTab() {
  return (
    <div className="space-y-4">
      {progresData.map((p) => (
        <div key={p.kategori}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{p.kategori}</span>
              <Badge
                variant={
                  p.status === "lengkap" ? "success" : p.status === "hampir" ? "warning" : "danger"
                }
              >
                {p.status === "lengkap" ? "Lengkap" : p.status === "hampir" ? "Hampir Lengkap" : "Kurang"}
              </Badge>
            </div>
            <span className="text-sm font-semibold text-gray-700">{p.persentase}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={cn(
                "h-2.5 rounded-full transition-all",
                p.persentase >= 100
                  ? "bg-green-500"
                  : p.persentase >= 80
                    ? "bg-yellow-500"
                    : "bg-red-500"
              )}
              style={{ width: `${p.persentase}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
