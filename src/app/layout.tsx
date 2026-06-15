import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { Toaster } from "react-hot-toast";
import TopbarNavigation from "@/components/layout/TopbarNavigation";
import BottomNav from "@/components/layout/BottomNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistem Kerja Bidang SD - Tim Kerja Kecamatan Lemahabang",
  description: "Sistem informasi manajemen bidang Sekolah Dasar",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-gray-100">
        <Providers>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <TopbarNavigation />
          <main className="pb-20 md:pb-8">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
