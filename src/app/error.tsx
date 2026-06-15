"use client";
import Button from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Terjadi Kesalahan</h2>
        <p className="mt-2 text-sm text-gray-500">
          {error.message || "Terjadi kesalahan yang tidak terduga."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="primary" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
          <Link href="/">
            <Button variant="outline">Kembali ke Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
