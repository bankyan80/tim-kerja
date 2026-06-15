import Link from "next/link";
import Button from "@/components/ui/Button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center max-w-md">
        <FileQuestion className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Halaman Tidak Ditemukan</h2>
        <p className="mt-2 text-sm text-gray-500">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button variant="primary">Kembali ke Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
