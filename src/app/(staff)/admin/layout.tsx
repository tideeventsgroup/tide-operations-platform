import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/domain/auth-service";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/dashboard");
  return <>{children}</>;
}
