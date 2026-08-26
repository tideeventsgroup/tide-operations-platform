import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/domain/auth-service";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <AdminNav />
      {children}
    </div>
  );
}
