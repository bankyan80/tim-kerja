"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Archive,
  Monitor,
  BarChart3,
  Building2,
  ClipboardList,
  Calendar,
  Settings,
  FileText,
  Grid3X3,
} from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";

const modules = [
  {
    name: "Arsip",
    description: "Kelola arsip digital",
    icon: Archive,
    href: "/arsip",
  },
  {
    name: "Monitoring",
    description: "Monitoring dan supervisi sekolah",
    icon: Monitor,
    href: "/monitoring",
  },
  {
    name: "Rekap",
    description: "Rekap data kecamatan",
    icon: BarChart3,
    href: "/rekap",
  },
  {
    name: "Sarpras",
    description: "Sarana dan prasarana",
    icon: Building2,
    href: "/sarpras",
  },
  {
    name: "SPMB",
    description: "Seleksi penerimaan murid baru",
    icon: ClipboardList,
    href: "/spmb",
  },
  {
    name: "Kegiatan",
    description: "Agenda dan kegiatan",
    icon: Calendar,
    href: "/kegiatan",
  },
  {
    name: "Pengaturan",
    description: "Pengaturan aplikasi",
    icon: Settings,
    href: "/pengaturan",
  },
  {
    name: "Laporan",
    description: "Laporan bulanan",
    icon: FileText,
    href: "/laporan",
  },
];

export default function LainnyaPage() {
  const { data: session } = useSession();

  if (!session) return <Loading message="Memuat..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Lainnya</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kecamatan Lemahabang
            </p>
          </div>
        </div>

        {modules.length === 0 ? (
          <EmptyState
            title="Tidak ada menu"
            message="Belum ada menu yang tersedia."
            icon={<Grid3X3 className="w-12 h-12 text-gray-300" />}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.name}
                  href={mod.href}
                  className="group block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {mod.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
