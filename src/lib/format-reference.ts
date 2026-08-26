// A compound event reference is <operation_reference>-<TYPE>-<number>,
// e.g. "TEG-EVT-2026-0001-EVT-0002". TYPE is "EVT" for references minted
// after the incidents->events rename, or the legacy "INC" for rows
// created before it. The operation_reference portion can ALSO contain its
// own embedded "-EVT-" (operations kept their pre-rename prefix on
// existing rows), so matching "-EVT-" as a bare substring anywhere in the
// string is wrong — it can match that embedded prefix instead of the
// event's own suffix. Anchoring to the end of the string is what makes
// this correct.
const REFERENCE_SUFFIX = /-(EVT|INC)-([^-]+)$/;

export function splitEventReference(reference: string): { prefix: string; number: string } {
  const match = reference.match(REFERENCE_SUFFIX);
  if (match) return { prefix: match[1], number: match[2] };
  return { prefix: "EVT", number: reference };
}
