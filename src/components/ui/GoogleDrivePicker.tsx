"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface GoogleDrivePickerProps {
  onSelect: (file: { id: string; name: string; url: string; size: number; mimeType: string }) => void;
}

export function GoogleDrivePicker({ onSelect }: GoogleDrivePickerProps) {
  const [ready, setReady] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    setApiKey(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || "");
    setClientId(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID || "");
  }, []);

  useEffect(() => {
    if (!apiKey || !clientId) return;

    const loadApis = () => {
      if (window.gapi && window.google?.accounts?.oauth2) { setReady(true); return; }
      // Load GIS
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        const s1 = document.createElement("script");
        s1.src = "https://accounts.google.com/gsi/client";
        s1.onload = () => {
          // Load Picker
          if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
            const s2 = document.createElement("script");
            s2.src = "https://apis.google.com/js/api.js";
            s2.onload = () => window.gapi.load("picker", () => setReady(true));
            document.body.appendChild(s2);
          }
        };
        document.body.appendChild(s1);
      }
    };
    loadApis();
  }, [apiKey, clientId]);

  const openPicker = useCallback(() => {
    if (!window.google?.accounts?.oauth2 || !window.gapi?.picker) return;

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          const picker = new window.gapi.picker.PickerBuilder()
            .setOAuthToken(tokenResponse.access_token)
            .setDeveloperKey(apiKey)
            .addView(new window.gapi.picker.DocsView()
              .setIncludeFolders(true)
              .setMimeTypes("application/pdf,image/png,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            )
            .setCallback((data: any) => {
              if (data.action === window.gapi.picker.Action.PICKED) {
                const doc = data.docs[0];
                onSelect({
                  id: doc.id,
                  name: doc.name,
                  url: `https://drive.google.com/file/d/${doc.id}/view`,
                  size: doc.sizeBytes || 0,
                  mimeType: doc.mimeType,
                });
              }
            })
            .build();
          picker.setVisible(true);
        }
      },
    });
    tokenClient.requestAccessToken();
  }, [apiKey, clientId, onSelect]);

  if (!apiKey || !clientId) {
    return (
      <p className="text-xs text-amber-600">
        Google Drive: atur <code>NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY</code> dan{" "}
        <code>NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID</code> di <code>.env.local</code>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={openPicker}
      disabled={!ready}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
    >
      <FolderOpen className="w-4 h-4" />
      {ready ? "Pilih dari Google Drive" : "Memuat Google Drive..."}
    </button>
  );
}
