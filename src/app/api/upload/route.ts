import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mime = file.type || "application/octet-stream";
    const dataUrl = `data:${mime};base64,${base64}`;
    return NextResponse.json({ url: dataUrl, name: file.name, size: file.size, type: mime });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
