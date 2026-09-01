import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { getOperation, listControlSessions, listOperationCordons, listOperationLocations } from "@/lib/domain/operation-service";
import { listActiveMajorIncidentsForOperation, listEventCategories, listEvents } from "@/lib/domain/event-service";
import { listRadioLogEntries } from "@/lib/domain/radio-log-service";
import { AutoRefresh } from "@/components/auto-refresh";
import { WallClock } from "@/components/operations/wall-clock";
import { LocationActivityPanel } from "@/components/operations/location-activity-panel";
import { priorityColor, isPriorityCode } from "@/lib/priority-colors";

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "Unassigned";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function elapsed(fromIso: string) {
  const ms = Date.now() - new Date(fromIso).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function untilLabel(toIso: string | null) {
  if (!toIso) return null;
  const ms = new Date(toIso).getTime() - Date.now();
  if (ms <= 0) return "now due";
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// The wall-display counterpart to the standard Control Overview: dark,
// full-bleed, no staff nav — meant for a lit-room screen read from across
// the room, not a desk. Deliberately outside the (staff) route group so
// it renders without StaffShell; the header below is this page's only
// chrome. Every figure on it is real — no fabricated callsigns or live
// headcounts where the data model doesn't actually track them.
export default async function OperationWallDisplayPage({ params }: PageProps<"/operations/[id]/wall">) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (profile.account_type !== "staff") redirect("/portal");
  if (!profile.organisation_id) redirect("/sign-in");

  let operation;
  try {
    operation = await getOperation(id);
  } catch {
    notFound();
  }

  const [events, categories, controlSessions, majorIncidents, locations, radioLog, cordons] = await Promise.all([
    listEvents(id),
    listEventCategories(),
    listControlSessions(id),
    listActiveMajorIncidentsForOperation(id),
    listOperationLocations(id),
    listRadioLogEntries(id),
    listOperationCordons(id),
  ]);
  const activeCordons = cordons.filter((c) => !c.closed_at);

  const categoryName = new Map(categories.map((c) => [c.code, c.name]));
  const openEvents = events
    .filter((e) => e.status !== "closed" && e.status !== "resolved")
    .sort((a, b) => {
      const rank = (p: string | null) => (isPriorityCode(p) ? Number(p.slice(1)) : 9);
      return rank(a.priority_code) - rank(b.priority_code);
    });
  const onDuty = controlSessions.filter((s) => !s.ended_at);

  const today = startOfToday();
  const loggedToday = events.filter((e) => new Date(e.created_at) >= today);
  const closedOnSite = events.filter((e) => (e.status === "closed" || e.status === "resolved") && (e.closed_at || e.resolved_at));
  const closeDurations = closedOnSite
    .map((e) => {
      const closed = e.closed_at ?? e.resolved_at;
      if (!closed) return null;
      return (new Date(closed).getTime() - new Date(e.created_at).getTime()) / 60000;
    })
    .filter((v): v is number => v !== null && v >= 0)
    .sort((a, b) => a - b);
  const medianCloseMinutes = closeDurations.length > 0 ? closeDurations[Math.floor(closeDurations.length / 2)] : null;
  const p1Today = loggedToday.filter((e) => e.priority_code === "P1").length;

  const openCountByLocation = new Map<string, number>();
  for (const e of openEvents) {
    if (!e.location_id) continue;
    openCountByLocation.set(e.location_id, (openCountByLocation.get(e.location_id) ?? 0) + 1);
  }
  const locationActivity = locations
    .map((loc) => ({ name: loc.name, count: openCountByLocation.get(loc.id) ?? 0 }))
    .filter((l) => l.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const untilClose = untilLabel(operation.closes_at);
  const capacityBase = operation.licensed_capacity ?? operation.planned_public_capacity;
  const capacityPct =
    capacityBase && operation.expected_attendance ? Math.min(100, Math.round((operation.expected_attendance / capacityBase) * 100)) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--wall-bg)" }}>
      <AutoRefresh intervalSeconds={30} />

      <div className="flex items-center gap-5 border-b px-6 py-3" style={{ borderColor: "var(--wall-border)" }}>
        <span className="font-mono text-sm font-bold tracking-[0.07em] text-white">SENTINEL</span>
        <div className="h-6 w-px" style={{ background: "var(--wall-border)" }} />
        <div>
          <div className="text-[15px] font-semibold text-white">{operation.name}</div>
          <div className="font-mono text-[11px] tracking-[0.05em]" style={{ color: "var(--wall-text-muted)" }}>
            CONTROL OVERVIEW · WALL DISPLAY
          </div>
        </div>
        <span
          className="flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.05em]"
          style={
            majorIncidents.length > 0
              ? { background: "color-mix(in oklab, var(--priority-p1) 22%, transparent)", borderColor: "var(--priority-p1)", color: "#ffb4a8" }
              : { background: "color-mix(in oklab, var(--priority-resolved) 20%, transparent)", borderColor: "var(--priority-resolved)", color: "#b7f0c9" }
          }
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: majorIncidents.length > 0 ? "var(--priority-p1)" : "var(--priority-resolved)" }}
          />
          {majorIncidents.length > 0 ? "MAJOR INCIDENT" : "NORMAL OPERATIONS"}
        </span>
        <div className="flex-1" />
        <div className="text-right">
          <WallClock />
          {untilClose ? (
            <div className="mt-0.5 font-mono text-[10.5px] tracking-[0.05em]" style={{ color: "var(--wall-text-muted)" }}>
              {untilClose.toUpperCase()} TO CLOSE
            </div>
          ) : null}
        </div>
        <Link href={`/operations/${id}/control-overview`} className="ml-3 font-mono text-[11px] text-white/60 hover:text-white">
          Exit wall view →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-px lg:grid-cols-[1fr_1fr_320px]" style={{ background: "var(--wall-border)" }}>
        {/* Open events */}
        <div className="p-5" style={{ background: "var(--wall-bg)" }}>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-[11px] tracking-[0.12em]" style={{ color: "var(--wall-text-muted)" }}>
              OPEN EVENTS
            </span>
            <span className="font-mono text-[13px] font-semibold text-white">{openEvents.length}</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {openEvents.length === 0 ? (
              <div className="rounded-md border p-4 text-sm" style={{ borderColor: "var(--wall-border)", color: "var(--wall-text-muted)" }}>
                Nothing open.
              </div>
            ) : (
              openEvents.slice(0, 6).map((e) => {
                const hasPriority = isPriorityCode(e.priority_code);
                return (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="rounded-md border-l-4 border p-4 transition-colors hover:border-white/25"
                    style={{
                      background: "var(--wall-panel)",
                      borderColor: "var(--wall-border)",
                      borderLeftColor: hasPriority ? priorityColor(e.priority_code) : "rgba(255,255,255,.22)",
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {hasPriority ? (
                        <span className="font-mono text-[13px] font-bold" style={{ color: priorityColor(e.priority_code) }}>
                          {e.priority_code}
                        </span>
                      ) : null}
                      <span className="font-mono text-[10.5px] tracking-[0.08em] text-white/55 uppercase">
                        {categoryName.get(e.category_code) ?? e.category_code}
                      </span>
                      <span className="ml-auto font-mono text-xs text-white/65">{e.reference}</span>
                    </div>
                    <div className="mb-2 text-[19px] leading-tight font-semibold text-wrap-pretty text-white">{e.summary}</div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <div className="font-mono text-[9.5px] tracking-[0.1em] text-white/40">LOCATION</div>
                        <div className="text-[13px] font-medium text-white/90">{e.operational_locations?.name ?? "Not specified"}</div>
                      </div>
                      <div>
                        <div className="font-mono text-[9.5px] tracking-[0.1em] text-white/40">OPEN FOR</div>
                        <div className="font-mono text-[13px] font-semibold text-white/85">{elapsed(e.created_at)}</div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: "EVENTS LOGGED", value: loggedToday.length },
              { label: "CLOSED ON SITE", value: closedOnSite.length },
              { label: "MEDIAN TO CLOSE", value: medianCloseMinutes !== null ? `${Math.round(medianCloseMinutes)}m` : "—" },
              { label: "P1 TODAY", value: p1Today },
            ].map((stat) => (
              <div key={stat.label} className="rounded-md border p-3" style={{ background: "var(--wall-panel)", borderColor: "var(--wall-border)" }}>
                <div className="font-mono text-2xl leading-none font-semibold text-white">{stat.value}</div>
                <div className="mt-1 font-mono text-[10px] tracking-[0.06em]" style={{ color: "var(--wall-text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location activity + roster */}
        <div className="p-5" style={{ background: "var(--wall-bg)" }}>
          {capacityPct !== null ? (
            <>
              <div className="mb-3 font-mono text-[11px] tracking-[0.12em]" style={{ color: "var(--wall-text-muted)" }}>
                EXPECTED ATTENDANCE
              </div>
              <div className="mb-4 rounded-md border p-4" style={{ background: "var(--wall-panel)", borderColor: "var(--wall-border)" }}>
                <div className="mb-3 flex items-end gap-3">
                  <div>
                    <div className="font-mono text-[34px] leading-none font-semibold text-white">
                      {operation.expected_attendance?.toLocaleString()}
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] tracking-[0.06em]" style={{ color: "var(--wall-text-muted)" }}>
                      EXPECTED · CAPACITY {capacityBase?.toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-auto text-right font-mono text-[15px] font-semibold" style={{ color: "var(--priority-resolved)" }}>
                    {capacityPct}%
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full" style={{ width: `${capacityPct}%`, background: "var(--priority-resolved)" }} />
                </div>
              </div>
            </>
          ) : null}

          <LocationActivityPanel locations={locationActivity} />

          <div className="mb-3 font-mono text-[11px] tracking-[0.12em]" style={{ color: "var(--wall-text-muted)" }}>
            ROSTER · {onDuty.length} ON DUTY
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {onDuty.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--wall-text-muted)" }}>
                No one currently on duty.
              </p>
            ) : (
              onDuty.map((s) => (
                <div key={s.id} className="rounded-md border p-3" style={{ background: "var(--wall-panel)", borderColor: "var(--wall-border)" }}>
                  <div className="font-mono text-[9.5px] tracking-[0.1em] text-white/40 uppercase">{s.operation_control_roles?.name}</div>
                  <div className="mt-0.5 text-[13.5px] font-medium text-white">{personName(s.profiles)}</div>
                  <div className="font-mono text-[11px]" style={{ color: "var(--priority-resolved)" }}>
                    ON DUTY
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 mb-3 font-mono text-[11px] tracking-[0.12em]" style={{ color: "var(--wall-text-muted)" }}>
            ACTIVE CORDONS &amp; CONTROL POINTS · {activeCordons.length}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {activeCordons.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--wall-text-muted)" }}>
                None established.
              </p>
            ) : (
              activeCordons.map((c) => (
                <div key={c.id} className="rounded-md border p-3" style={{ background: "var(--wall-panel)", borderColor: "var(--wall-border)" }}>
                  <div className="font-mono text-[9.5px] tracking-[0.1em] text-white/40 uppercase">{c.type.replace(/_/g, " ")}</div>
                  <div className="mt-0.5 text-[13.5px] font-medium text-white">{c.label}</div>
                  {c.what3words ? (
                    <div className="font-mono text-[10.5px]" style={{ color: "var(--wall-text-muted)" }}>
                      {`///${c.what3words.replace(/^\/+/, "")}`}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Radio log */}
        <div className="p-5" style={{ background: "var(--wall-bg)" }}>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-[11px] tracking-[0.12em]" style={{ color: "var(--wall-text-muted)" }}>
              RADIO LOG
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.06em]" style={{ color: "var(--priority-resolved)" }}>
              <span className="size-1.5 rounded-full" style={{ background: "var(--priority-resolved)" }} />
              LIVE
            </span>
          </div>
          <div className="flex flex-col">
            {radioLog.length === 0 ? (
              <p className="py-4 text-sm" style={{ color: "var(--wall-text-muted)" }}>
                No radio traffic logged yet.
              </p>
            ) : (
              radioLog.slice(0, 10).map((entry) => (
                <div key={entry.id} className="border-b py-2.5 last:border-b-0" style={{ borderColor: "var(--wall-border)" }}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--wall-text-muted)" }}>
                      {new Date(entry.occurred_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="font-mono text-[10.5px] font-semibold tracking-[0.05em]" style={{ color: "oklch(0.78 0.13 245)" }}>
                      {entry.from_callsign ?? "—"}
                      {entry.to_callsign ? ` → ${entry.to_callsign}` : ""}
                    </span>
                    {entry.significant ? (
                      <span className="ml-auto rounded px-1 py-0.5 font-mono text-[9px] font-semibold" style={{ background: "var(--priority-p2)", color: "#1a1204" }}>
                        SIG
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[12.5px] leading-snug text-white/85">{entry.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
