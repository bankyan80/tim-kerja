import { DefaultSession } from "next-auth";
import { UserRole } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      sekolah_id?: string;
    } & DefaultSession["user"];
  }
}
