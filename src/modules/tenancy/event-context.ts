import type { SupabaseClient } from "@supabase/supabase-js";

export type EventContext = {
  clientId: string;
  displayReference: string;
  endsAt: string;
  eventId: string;
  name: string;
  startsAt: string;
  timezone: string;
};

type EventRecord = {
  client_id: string;
  display_reference: string;
  ends_at: string;
  id: string;
  name: string;
  starts_at: string;
  timezone: string;
};

export class EventAccessDeniedError extends Error {
  constructor() {
    super("The requested event is unavailable.");
  }
}

export async function resolveEventContext(
  client: SupabaseClient,
  eventId: string,
): Promise<EventContext> {
  validateEventId(eventId);

  const { data, error } = await client
    .from("events")
    .select("id, client_id, name, display_reference, timezone, starts_at, ends_at")
    .eq("id", eventId)
    .maybeSingle<EventRecord>();

  if (error || !data) {
    throw new EventAccessDeniedError();
  }

  return mapEventRecord(data);
}

export function validateEventId(eventId: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
    throw new EventAccessDeniedError();
  }
}

function mapEventRecord(record: EventRecord): EventContext {
  return {
    clientId: record.client_id,
    displayReference: record.display_reference,
    endsAt: record.ends_at,
    eventId: record.id,
    name: record.name,
    startsAt: record.starts_at,
    timezone: record.timezone,
  };
}
