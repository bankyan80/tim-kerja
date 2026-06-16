"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  Printer,
  FileDown,
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
  "Progres Pengumpulan Data",
] as const;

type Tab = (typeof tabs)[number];

const tahunPelajaranOptions = [
  "2024/2025",
  "2025/2026",
  "2026/2027",
];

type RekapData = {
  dataSekolah: { label: string; value: number; variant: string }[];
  dataSiswa: { total: number; laki: number; perempuan: number; perKelas: { kelas: string; jumlah: number }[]; perSekolah: { sekolah: string; total: number; laki: number; perempuan: number; kelas_i: number; kelas_ii: number; kelas_iii: number; kelas_iv: number; kelas_v: number; kelas_vi: number }[] };
  dataGTK: { total: number; pns: number; nonPns: number; honorer: number; perSekolah: { sekolah: string; total: number; pns: number; nonPns: number; honorer: number }[] };
  mappingPegawai: { sekolah: string; kepala_sekolah: string; guru: number; staf: number; operator: string }[];
  laporanBulanan: { sekolahNama: string[]; stats: Record<string, unknown> };
  sarpras: { totalRuang: number; totalUnit: number; kondisiBaik: number; kondisiSedang: number; kondisiRusak: number; perJenis: { jenis: string; jumlah: number; baik: number; sedang: number; rusak: number }[] };
  spmb: { totalPendaftar: number; diterima: number; cadangan: number; mengundurkanDiri: number; perSekolah: { sekolah: string; pendaftar: number; diterima: number; cadangan: number; mengundur: number }[] };
  surat: { total: number; masuk: number; keluar: number; disposisi: number; perBulan: { bulan: string; masuk: number; keluar: number }[] };
  progresData: { kategori: string; count: number; persentase: number; status: string }[];
};

export default function RekapPage() {
  useSession();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RekapData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Data Sekolah");
  const [tahunPelajaran, setTahunPelajaran] = useState("2025/2026");

  useEffect(() => {
    fetch("/api/rekap")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const overallProgress = data?.progresData?.length
    ? Math.round(data.progresData.reduce((sum, p) => sum + p.persentase, 0) / data.progresData.length)
    : 0;

  if (loading) return <Loading message="Memuat data rekap..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Sekolah</p>
              <p className="text-2xl font-bold text-blue-600">{data?.dataSekolah?.[0]?.value ?? 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Siswa</p>
              <p className="text-2xl font-bold text-green-600">{data?.dataSiswa?.total?.toLocaleString() ?? 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total GTK</p>
              <p className="text-2xl font-bold text-purple-600">{data?.dataGTK?.total?.toLocaleString() ?? 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Progres Data</p>
              <p className="text-2xl font-bold text-orange-600">{overallProgress}%</p>
            </div>
          </Card>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle>{activeTab}</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === "Data Sekolah" && <DataSekolahTab data={data?.dataSekolah} />}
            {activeTab === "Data Siswa" && <DataSiswaTab data={data?.dataSiswa} />}
            {activeTab === "Data GTK" && <DataGTKTab data={data?.dataGTK} />}
            {activeTab === "Mapping Pegawai" && <MappingPegawaiTab data={data?.mappingPegawai} />}
            {activeTab === "Laporan Bulanan" && <LaporanBulananTab data={data?.laporanBulanan} />}
            {activeTab === "Sarpras" && <SarprasTab data={data?.sarpras} />}
            {activeTab === "SPMB" && <SPMBTab data={data?.spmb} />}
            {activeTab === "Surat" && <SuratTab data={data?.surat} />}
            {activeTab === "Progres Pengumpulan Data" && <ProgresTab data={data?.progresData} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, variant }: { label: string; value: number; variant: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-2xl font-bold">{value?.toLocaleString() ?? 0}</p>
      <Badge variant={variant as "info" | "success" | "warning" | "danger" | "default"} className="mt-1">{label}</Badge>
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

function DataSekolahTab({ data }: { data?: { label: string; value: number; variant: string }[] }) {
  if (!data?.length) return <EmptyState title="Belum ada data sekolah" />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {data.map((d) => (
        <StatCard key={d.label} {...d} />
      ))}
    </div>
  );
}

function DataSiswaTab({ data }: { data?: { total: number; laki: number; perempuan: number; perKelas: { kelas: string; jumlah: number }[]; perSekolah: { sekolah: string; total: number; laki: number; perempuan: number; kelas_i: number; kelas_ii: number; kelas_iii: number; kelas_iv: number; kelas_v: number; kelas_vi: number }[] } }) {
  if (!data) return <EmptyState title="Belum ada data siswa" />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Siswa" value={data.total} variant="info" />
        <StatCard label="Laki-laki" value={data.laki} variant="info" />
        <StatCard label="Perempuan" value={data.perempuan} variant="info" />
      </div>
      {data.perKelas?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Jumlah Siswa per Kelas</h4>
          <TabTable headers={["Kelas", "Jumlah"]} rows={data.perKelas.map((k) => [k.kelas, k.jumlah])} />
        </div>
      )}
      {data.perSekolah?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Rekapitulasi per Sekolah</h4>
          <div className="overflow-x-auto">
            <TabTable
              headers={["Sekolah", "Total", "L", "P", "Kls I", "Kls II", "Kls III", "Kls IV", "Kls V", "Kls VI"]}
              rows={data.perSekolah.map((s) => [
                s.sekolah,
                s.total,
                s.laki,
                s.perempuan,
                s.kelas_i,
                s.kelas_ii,
                s.kelas_iii,
                s.kelas_iv,
                s.kelas_v,
                s.kelas_vi,
              ])}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DataGTKTab({ data }: { data?: { total: number; pns: number; nonPns: number; honorer: number; perSekolah: { sekolah: string; total: number; pns: number; nonPns: number; honorer: number }[] } }) {
  if (!data) return <EmptyState title="Belum ada data GTK" />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total GTK" value={data.total} variant="info" />
        <StatCard label="PNS" value={data.pns} variant="success" />
        <StatCard label="Non PNS" value={data.nonPns} variant="warning" />
        <StatCard label="Honorer" value={data.honorer} variant="default" />
      </div>
      {data.perSekolah?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">GTK per Sekolah</h4>
          <TabTable
            headers={["Sekolah", "Total", "PNS", "Non PNS", "Honorer"]}
            rows={data.perSekolah.map((s) => [s.sekolah, s.total, s.pns, s.nonPns, s.honorer])}
          />
        </div>
      )}
    </div>
  );
}

function MappingPegawaiTab({ data }: { data?: { sekolah: string; kepala_sekolah: string; guru: number; staf: number; operator: string }[] }) {
  if (!data?.length) return <EmptyState title="Belum ada data mapping pegawai" />;
  return (
    <TabTable
      headers={["Sekolah", "Kepala Sekolah", "Jumlah Guru", "Staf TU"]}
      rows={data.map((m) => [m.sekolah, m.kepala_sekolah, m.guru, m.staf])}
    />
  );
}

function LaporanBulananTab({ data }: { data?: { sekolahNama: string[]; stats: Record<string, unknown> } }) {
  if (!data?.sekolahNama?.length) return <EmptyState title="Belum ada data laporan bulanan" />;
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return (
    <div>
      <TabTable
        headers={["Bulan", ...data.sekolahNama]}
        rows={months.map((bulan) => [
          bulan,
          ...data.sekolahNama.map(() => (
            <span key={bulan} className="text-gray-400">&mdash;</span>
          )),
        ])}
      />
    </div>
  );
}

function SarprasTab({ data }: { data?: { totalRuang: number; totalUnit: number; kondisiBaik: number; kondisiSedang: number; kondisiRusak: number; perJenis: { jenis: string; jumlah: number; baik: number; sedang: number; rusak: number }[] } }) {
  if (!data) return <EmptyState title="Belum ada data sarpras" />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Item" value={data.totalUnit} variant="info" />
        <StatCard label="Kondisi Baik" value={data.kondisiBaik} variant="success" />
        <StatCard label="Kondisi Sedang" value={data.kondisiSedang} variant="warning" />
        <StatCard label="Kondisi Rusak" value={data.kondisiRusak} variant="danger" />
      </div>
      {data.perJenis?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Rekapitulasi per Jenis</h4>
          <TabTable
            headers={["Jenis Sarpras", "Jumlah", "Baik", "Sedang", "Rusak"]}
            rows={data.perJenis.map((j) => [j.jenis, j.jumlah, j.baik, j.sedang, j.rusak])}
          />
        </div>
      )}
    </div>
  );
}

function SPMBTab({ data }: { data?: { totalPendaftar: number; diterima: number; cadangan: number; mengundurkanDiri: number; perSekolah: { sekolah: string; pendaftar: number; diterima: number; cadangan: number; mengundur: number }[] } }) {
  if (!data) return <EmptyState title="Belum ada data SPMB" />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pendaftar" value={data.totalPendaftar} variant="info" />
        <StatCard label="Diterima" value={data.diterima} variant="success" />
        <StatCard label="Cadangan" value={data.cadangan} variant="warning" />
        <StatCard label="Mengundurkan Diri" value={data.mengundurkanDiri} variant="danger" />
      </div>
      {data.perSekolah?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Per Sekolah</h4>
          <TabTable
            headers={["Sekolah", "Pendaftar", "Diterima", "Cadangan", "Mengundurkan Diri"]}
            rows={data.perSekolah.map((s) => [s.sekolah, s.pendaftar, s.diterima, s.cadangan, s.mengundur])}
          />
        </div>
      )}
    </div>
  );
}

function SuratTab({ data }: { data?: { total: number; masuk: number; keluar: number; disposisi: number; perBulan: { bulan: string; masuk: number; keluar: number }[] } }) {
  if (!data) return <EmptyState title="Belum ada data surat" />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Surat" value={data.total} variant="info" />
        <StatCard label="Surat Masuk" value={data.masuk} variant="success" />
        <StatCard label="Surat Keluar" value={data.keluar} variant="warning" />
        <StatCard label="Disposisi" value={data.disposisi} variant="default" />
      </div>
      {data.perBulan?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Per Bulan</h4>
          <TabTable
            headers={["Bulan", "Surat Masuk", "Surat Keluar"]}
            rows={data.perBulan.map((b) => [b.bulan, b.masuk, b.keluar])}
          />
        </div>
      )}
    </div>
  );
}

function ProgresTab({ data }: { data?: { kategori: string; count: number; persentase: number; status: string }[] }) {
  if (!data?.length) return <EmptyState title="Belum ada data" />;
  return (
    <div className="space-y-4">
      {data.map((p) => (
        <div key={p.kategori}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{p.kategori}</span>
              <Badge
                variant={p.status === "lengkap" ? "success" : p.status === "hampir" ? "warning" : "danger"}
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
                p.persentase >= 100 ? "bg-green-500" : p.persentase >= 80 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${p.persentase}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
