import { validateEventId } from "@/modules/tenancy/event-context";

export type IncidentEntryMode = "quick" | "full";
export type IncidentReportSource = "operator" | "field_reporter" | "radio" | "member_of_public" | "emergency_service" | "other";
export type IncidentSeverity = "unknown" | "low" | "moderate" | "high" | "critical";

export type CreateIncidentCommand = {
  categoryId: string | null;
  entryMode: IncidentEntryMode;
  eventId: string;
  idempotencyKey: string;
  immediateAssistanceRequired: boolean;
  initialReport: string | null;
  locationId: string | null;
  occurredAt: string;
  reportSource: IncidentReportSource;
  severity: IncidentSeverity;
  subcategoryId: string | null;
  title: string | null;
  zoneId: string | null;
};

export const quickReportInputKeys = ["categoryId", "locationOrZone", "severity", "initialReport", "immediateAssistanceRequired"] as const;

export type CreateIncidentResult = {
  created: boolean;
  incidentId: string;
  incidentReference: string;
  receiptId: string;
};

export class InvalidIncidentCommandError extends Error {
  constructor() {
    super("The incident report is not valid.");
  }
}

type CreateInput = {
  categoryId?: unknown;
  entryMode?: unknown;
  eventId: string;
  idempotencyKey: string;
  immediateAssistanceRequired?: unknown;
  initialReport?: unknown;
  locationId?: unknown;
  occurredAt?: unknown;
  reportSource?: unknown;
  severity?: unknown;
  subcategoryId?: unknown;
  title?: unknown;
  zoneId?: unknown;
};

export function createIncidentCommand(input: CreateInput): CreateIncidentCommand {
  validateEventId(input.eventId);
  validateUuid(input.idempotencyKey);
  const entryMode = normalizeEnum(input.entryMode, "quick", ["quick", "full"]);
  const command = {
    categoryId: normalizeOptionalUuid(input.categoryId),
    entryMode,
    eventId: input.eventId,
    idempotencyKey: input.idempotencyKey,
    immediateAssistanceRequired: normalizeBoolean(input.immediateAssistanceRequired, entryMode === "quick"),
    initialReport: normalizeText(input.initialReport, 4000),
    locationId: normalizeOptionalUuid(input.locationId),
    occurredAt: normalizeOccurredAt(input.occurredAt),
    reportSource: normalizeEnum(input.reportSource, "operator", ["operator", "field_reporter", "radio", "member_of_public", "emergency_service", "other"]),
    severity: normalizeEnum(input.severity, "unknown", ["unknown", "low", "moderate", "high", "critical"]),
    subcategoryId: normalizeOptionalUuid(input.subcategoryId),
    title: normalizeText(input.title, 200),
    zoneId: normalizeOptionalUuid(input.zoneId),
  };
  if (command.subcategoryId && !command.categoryId) throw new InvalidIncidentCommandError();
  if (entryMode === "quick" && (!command.categoryId || (!command.locationId && !command.zoneId) || command.severity === "unknown" || !command.initialReport)) throw new InvalidIncidentCommandError();
  return command;
}

export function normalizeInitialReport(value: unknown): string | null {
  return normalizeText(value, 4000);
}

function normalizeOccurredAt(value: unknown): string {
  if (value === undefined) return new Date().toISOString();
  if (typeof value !== "string") throw new InvalidIncidentCommandError();
  const occurredAt = new Date(value);
  if (Number.isNaN(occurredAt.getTime())) throw new InvalidIncidentCommandError();
  return occurredAt.toISOString();
}

function normalizeText(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new InvalidIncidentCommandError();
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new InvalidIncidentCommandError();
  return normalized || null;
}

function normalizeOptionalUuid(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new InvalidIncidentCommandError();
  validateUuid(value);
  return value;
}

function normalizeEnum<T extends string>(value: unknown, fallback: T, values: readonly T[]): T {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || !values.includes(value as T)) throw new InvalidIncidentCommandError();
  return value as T;
}

function normalizeBoolean(value: unknown, required: boolean): boolean {
  if (value === undefined || value === null) {
    if (required) throw new InvalidIncidentCommandError();
    return false;
  }
  if (typeof value !== "boolean") throw new InvalidIncidentCommandError();
  return value;
}

function validateUuid(value: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new InvalidIncidentCommandError();
  }
}
