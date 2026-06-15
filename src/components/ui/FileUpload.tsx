"use client";
import { useRef, useState } from "react";
import { Upload, X, File } from "lucide-react";
import Button from "./Button";

interface FileUploadProps {
  accept?: string;
  label?: string;
  onUpload: (file: { url: string; name: string; size: number; type: string }) => void;
  preview?: boolean;
  currentFile?: string;
}

export default function FileUpload({ accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx", label = "Unggah File", onUpload, preview = true, currentFile }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (preview && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      onUpload(data);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        onUpload({ url: dataUrl, name: file.name, size: file.size, type: file.type });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      {(previewUrl || currentFile) && preview && (
        <div className="relative inline-block">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-20 h-20 rounded-lg object-cover border" />
          ) : currentFile?.startsWith("data:image") ? (
            <img src={currentFile} alt="Current" className="w-20 h-20 rounded-lg object-cover border" />
          ) : currentFile ? (
            <div className="w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center border">
              <File className="w-8 h-8 text-gray-400" />
            </div>
          ) : null}
          {previewUrl && (
            <button onClick={() => setPreviewUrl(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} loading={uploading}>
        <Upload className="w-3 h-3 mr-1" />
        {label}
      </Button>
    </div>
  );
}
