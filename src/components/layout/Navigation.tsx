"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Mail,
  School,
  Users,
  GraduationCap,
  FileText,
  Building2,
  ClipboardList,
  Calendar,
  Archive,
  Monitor,
  BarChart3,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const menuItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Persuratan", href: "/persuratan", icon: Mail },
  { label: "Data Sekolah", href: "/data-sekolah", icon: School },
  { label: "Data Siswa", href: "/data-siswa", icon: Users },
  { label: "Data GTK", href: "/data-gtk", icon: GraduationCap },
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

export default function Navigation() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  if (pathname === "/login") return null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="hidden md:block bg-white border-b border-gray-200">
      <div className="flex items-center px-4 lg:px-6 overflow-x-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/") || (item.href === "/" && pathname === "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              showMore ? "text-blue-600 border-blue-600" : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
            Lainnya
            <ChevronDown className="w-3 h-3" />
          </button>

          {showMore && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {extraItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm",
                      isActive ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
