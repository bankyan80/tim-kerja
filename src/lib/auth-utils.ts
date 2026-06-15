import { auth } from "./auth";

export async function getSekolahFilter(): Promise<{ forcedSekolah: string | null; userRole: string }> {
  const session = await auth();
  const role = session?.user?.role || "";
  if (role === "operator_sekolah") {
    return { forcedSekolah: session?.user?.sekolah_id || null, userRole: role };
  }
  return { forcedSekolah: null, userRole: role };
}
