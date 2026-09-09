import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type InternalRole = "admin" | "event_control" | "fmic" | "staff" | "view_only";

const capabilityRoles: Record<string, readonly InternalRole[]> = {
  "event.read": ["admin", "event_control", "fmic", "staff", "view_only"],
  "incident.create": ["admin", "event_control", "staff"],
  "incident.manage": ["admin", "event_control", "fmic"],
  "period.manage": ["admin", "event_control"],
  "perimeter.check": ["admin", "event_control"],
  "casualty.manage": ["admin", "event_control", "fmic"],
  "radio.read": ["admin", "event_control", "fmic", "staff", "view_only"],
  "radio.issue": ["admin", "event_control"],
  "radio.return": ["admin", "event_control"],
  "radio.export": ["admin", "event_control"],
};

export function hasCapability(role: InternalRole, capability: string): boolean {
  return capabilityRoles[capability]?.includes(role) ?? false;
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/sign-in");
  return { id: session.user.id, role: session.user.role as InternalRole, name: session.user.name ?? "Operator" };
}

export async function requireCapability(capability: string) {
  const session = await requireSession();
  if (!hasCapability(session.role, capability)) redirect("/access-denied");
  return session;
}
