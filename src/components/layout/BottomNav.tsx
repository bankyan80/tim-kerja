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
  MoreHorizontal,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Persuratan", href: "/persuratan", icon: Mail },
  { label: "Sekolah", href: "/data-sekolah", icon: School },
  { label: "Siswa", href: "/data-siswa", icon: Users },
  { label: "GTK", href: "/data-gtk", icon: GraduationCap },
  { label: "Laporan", href: "/laporan", icon: FileText },
  { label: "Lainnya", href: "/lainnya", icon: MoreHorizontal },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/" && pathname === "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors min-w-0",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
