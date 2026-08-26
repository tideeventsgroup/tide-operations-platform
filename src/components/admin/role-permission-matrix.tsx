"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";
import { deleteRole, setRolePermission } from "@/lib/actions/admin-roles";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill } from "@/components/ui/data-table";
import { DeleteConfigButton } from "@/components/admin/delete-config-button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type RoleWithPermissions = Tables<"roles"> & { role_permissions: { permission_id: string }[] };
type Permission = Tables<"permissions">;

export function RolePermissionMatrix({ roles, permissions }: { roles: RoleWithPermissions[]; permissions: Permission[] }) {
  const [pending, startTransition] = useTransition();

  const modules = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) {
      map.set(p.module, [...(map.get(p.module) ?? []), p]);
    }
    return Array.from(map.entries());
  }, [permissions]);

  function toggle(roleId: string, permissionId: string, enabled: boolean) {
    startTransition(async () => {
      const result = await setRolePermission(roleId, permissionId, enabled);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="text-sm">
        <thead className="border-b border-border">
          <tr>
            <th className="sticky left-0 z-10 min-w-48 bg-card px-4 py-2 text-left align-bottom text-xs font-medium text-muted-foreground"></th>
            {modules.map(([module, perms]) => (
              <th
                key={module}
                colSpan={perms.length}
                className="border-l border-border px-2 py-1.5 text-center text-xs font-semibold text-foreground capitalize"
              >
                {module}
              </th>
            ))}
          </tr>
          <tr className="border-t border-border">
            <th className="sticky left-0 z-10 min-w-48 bg-card px-4 py-2 text-left text-xs font-medium text-muted-foreground">Role</th>
            {modules.map(([, perms]) =>
              perms.map((p) => (
                <th
                  key={p.id}
                  title={p.description ?? undefined}
                  className="border-l border-border px-2 py-1.5 text-center text-[11px] font-medium whitespace-nowrap text-muted-foreground"
                >
                  {p.action}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {roles.map((role) => {
            const granted = new Set(role.role_permissions.map((rp) => rp.permission_id));
            return (
              <tr key={role.id} className="hover:bg-muted/40">
                <td className="sticky left-0 z-10 min-w-48 bg-card px-4 py-2 align-top">
                  <div className="font-medium text-foreground">{role.name}</div>
                  <div className="flex items-center gap-1.5">
                    {role.is_system ? <Pill tone="neutral">System</Pill> : <Pill tone="info">Custom</Pill>}
                    {role.is_external ? <Pill tone="warning">External</Pill> : null}
                    {!role.is_system ? <DeleteConfigButton label={role.name} onDelete={() => deleteRole(role.id)} /> : null}
                  </div>
                </td>
                {modules.map(([, perms]) =>
                  perms.map((p) => {
                    const isGranted = granted.has(p.id);
                    return (
                      <td key={p.id} className={cn("border-l border-border px-2 py-2 text-center", role.is_system ? "" : "bg-primary/[0.02]")}>
                        {role.is_system ? (
                          isGranted ? (
                            <CheckIcon className="mx-auto size-3.5 text-muted-foreground" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )
                        ) : (
                          <Checkbox
                            checked={isGranted}
                            disabled={pending}
                            onCheckedChange={(checked) => toggle(role.id, p.id, checked === true)}
                          />
                        )}
                      </td>
                    );
                  }),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
