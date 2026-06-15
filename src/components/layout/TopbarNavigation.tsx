"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Search, Bell, User, ChevronDown, LogOut, Settings, MoreHorizontal, LayoutDashboard, Mail, School, Users, GraduationCap, FileText, Building2, ClipboardList, Calendar, Archive, Monitor, BarChart3 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

const menuItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Persuratan", href: "/persuratan", icon: Mail },
  { label: "Sekolah", href: "/data-sekolah", icon: School },
  { label: "Siswa", href: "/data-siswa", icon: Users },
  { label: "GTK", href: "/data-gtk", icon: GraduationCap },
  { label: "Laporan", href: "/laporan", icon: FileText },
  { label: "Sarpras", href: "/sarpras", icon: Building2 },
  { label: "SPMB", href: "/spmb", icon: ClipboardList },
  { label: "Kegiatan", href: "/kegiatan", icon: Calendar },
];

const extraItems = [
  { label: "Arsip", href: "/arsip", icon: Archive },
  { label: "Monitoring", href: "/monitoring", icon: Monitor },
  { label: "Rekap", href: "/rekap", icon: BarChart3 },
];

export default function TopbarNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session || pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center h-14 px-3 lg:px-4 gap-2">
        {/* Logo + App Name */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/uploads/logo-kabupaten.svg" alt="" className="w-7 h-7" />
          <span className="text-xs font-bold text-blue-900 leading-tight hidden sm:block">
            Sistem Kerja Bidang SD
          </span>
        </Link>

        <div className="w-px h-6 bg-gray-200 hidden md:block" />

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/") || (item.href === "/" && pathname === "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                  isActive
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}

          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setShowMore(!showMore)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                showMore ? "text-blue-700 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
              Lainnya
              <ChevronDown className="w-3 h-3" />
            </button>

            {showMore && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {extraItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMore(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          {/* Search */}
          {showSearch ? (
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari..."
                className="w-32 text-xs bg-transparent outline-none"
                autoFocus
                onBlur={() => !searchQuery && setShowSearch(false)}
              />
            </div>
          ) : (
            <button onClick={() => setShowSearch(true)} className="p-1.5 rounded-md hover:bg-gray-100">
              <Search className="w-4 h-4 text-gray-500" />
            </button>
          )}

          {/* Notif */}
          <button className="relative p-1.5 rounded-md hover:bg-gray-100">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-1.5 p-1 rounded-md hover:bg-gray-100"
            >
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="hidden sm:block text-xs font-medium text-gray-700 max-w-[100px] truncate">
                {session.user?.name}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link href="/pengaturan" onClick={() => setShowProfile(false)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                  <Settings className="w-3.5 h-3.5" />
                  Pengaturan
                </Link>
                <button onClick={() => router.push("/api/auth/signout")} className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 w-full">
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
