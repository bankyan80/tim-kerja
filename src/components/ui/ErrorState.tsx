import { AlertTriangle, RefreshCw } from "lucide-react";
import Button from "./Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Terjadi kesalahan.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="w-12 h-12 text-red-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-600">Oops!</h3>
      <p className="mt-1 text-sm text-gray-400">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
