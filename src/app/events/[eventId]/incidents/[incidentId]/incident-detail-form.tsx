"use client";

import { FormEvent, useState } from "react";
import styles from "./incident-workspace.module.css";

type Section = "reporter" | "information" | "assessment" | "impact" | "closure" | "resources" | "agencies" | "people" | "evidence" | "escalation" | "review";
const details: Record<Section, { table: string; fields: [string, string, "text" | "textarea" | "checkbox"][] }> = {
  reporter: { table: "incident_reporters", fields: [["reporter_name", "Reporter name", "text"], ["reporter_role", "Role or team", "text"], ["reporter_organisation", "Organisation", "text"], ["radio_callsign", "Radio call sign", "text"], ["contact_number", "Contact number", "text"]] },
  information: { table: "incident_initial_details", fields: [["what_happened", "What happened?", "textarea"], ["current_situation", "What is happening now?", "textarea"], ["people_involved", "Who is involved?", "textarea"], ["immediate_hazards", "Immediate hazards", "textarea"], ["casualties_present", "Casualties present", "checkbox"], ["immediate_threat_to_life", "Immediate threat to life", "checkbox"], ["incident_ongoing", "Incident remains ongoing", "checkbox"]] },
  assessment: { table: "incident_assessments", fields: [["risk_to_people", "Risk to people (low / medium / high / critical)", "text"], ["escalation_risk", "Risk of escalation", "text"], ["operational_impact", "Impact on operations", "text"], ["event_control_command_required", "Event Control command required", "checkbox"], ["level_rationale", "Reason for this assessment", "textarea"]] },
  impact: { table: "incident_operational_impacts", fields: [["affected_area", "Affected area", "text"], ["service_or_activity_impact", "Service or activity impact", "textarea"], ["crowd_management_measures", "Crowd management measures", "textarea"], ["access_egress_impact", "Access and egress impact", "textarea"], ["communications_impact", "Communications impact", "textarea"]] },
  closure: { table: "incident_closures", fields: [["outcome", "Outcome", "textarea"], ["closure_rationale", "Resolution and closure rationale", "textarea"], ["lessons_identified", "Lessons identified / follow-up", "textarea"]] },
  resources: { table: "incident_resources", fields: [["resource_type", "Resource type", "text"], ["resource_name", "Team or person", "text"], ["callsign", "Call sign", "text"], ["notes", "Deployment notes", "textarea"]] },
  agencies: { table: "incident_agencies", fields: [["agency", "Agency", "text"], ["contact_reference", "Contact / incident reference", "text"], ["notes", "Contact and handover notes", "textarea"]] },
  people: { table: "incident_people", fields: [["person_role", "Person role", "text"], ["name", "Name, if necessary", "text"], ["description", "Description", "textarea"], ["welfare_notes", "Welfare notes", "textarea"]] },
  evidence: { table: "incident_evidence", fields: [["evidence_type", "Evidence type", "text"], ["reference", "Reference", "text"], ["description", "Description", "textarea"]] },
  escalation: { table: "incident_escalations", fields: [["notified_party", "Notified party", "text"], ["reason", "Reason for escalation", "textarea"], ["outcome", "Outcome", "textarea"]] },
  review: { table: "incident_follow_up_actions", fields: [["action", "Follow-up action", "textarea"], ["owner", "Owner", "text"], ["status", "Status", "text"]] },
};

export function IncidentDetailForm({ eventId, incidentId, section }: { eventId: string; incidentId: string; section: Section }) {
  const [message, setMessage] = useState<string>(); const [saving, setSaving] = useState(false); const detail = details[section];
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget); const values: Record<string, unknown> = {}; detail.fields.forEach(([name, , type]) => { values[name] = type === "checkbox" ? form.get(name) === "on" : form.get(name); }); const response = await fetch(`/api/events/${eventId}/incidents/${incidentId}/details`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: detail.table, values }) }); setSaving(false); setMessage(response.ok ? "Section saved to the operational record." : "This section could not be saved."); }
  return <form className={styles.detailForm} onSubmit={submit}>{detail.fields.map(([name, label, type]) => type === "checkbox" ? <label className={styles.checkboxField} key={name}><input name={name} type="checkbox" />{label}</label> : <label className="field-label" key={name}>{label}{type === "textarea" ? <textarea className="text-input" name={name} rows={4} required={name === "level_rationale"} /> : <input className="text-input" name={name} />}</label>)}{message ? <p className={message.startsWith("Section") ? styles.saveSuccess : styles.saveError} role="status">{message}</p> : null}<button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save section"}</button></form>;
}
