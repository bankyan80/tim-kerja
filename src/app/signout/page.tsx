"use client";

import { signOut } from "next-auth/react";

export default function SignOutPage() {
  return (
    <div className="login-page">
      <div className="login-card text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
          <img src="/logokab.png" alt="Logo Kabupaten Cirebon" className="h-full w-full object-contain" />
        </div>

        <h1 className="text-xl font-bold text-gray-800">
          Keluar dari Sistem
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Apakah Anda yakin ingin keluar?
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 active:bg-red-800"
          >
            Ya, Keluar
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:bg-gray-100"
          >
            Batal
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Sistem Kerja Bidang SD &mdash; Tim Kerja Kecamatan Lemahabang
        </p>
      </div>
    </div>
  );
}
