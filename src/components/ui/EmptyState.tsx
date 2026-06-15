import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Tidak ada data",
  message = "Belum ada data yang tersedia.",
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon || <Inbox className="w-12 h-12 text-gray-300" />}
      <h3 className="mt-4 text-lg font-medium text-gray-600">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">{message}</p>
    </div>
  );
}
