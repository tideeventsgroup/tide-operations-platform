"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClientRecord, createClientContact } from "@/lib/domain/client-service";
import { getCurrentProfile } from "@/lib/domain/auth-service";

export type ActionResult = { error?: string; success?: boolean };

const clientSchema = z.object({
  legal_name: z.string().trim().min(1, { error: "Enter the client's legal name." }),
  trading_name: z.string().trim().optional(),
  website: z.string().trim().optional(),
  billing_email: z.string().trim().email().optional().or(z.literal("")),
  address_line1: z.string().trim().optional(),
  city: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createClientAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile?.organisation_id) return { error: "Your account has no organisation." };

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };

  let client;
  try {
    client = await createClientRecord({
      ...parsed.data,
      billing_email: parsed.data.billing_email || undefined,
      organisation_id: profile.organisation_id,
      created_by: profile.id,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create client." };
  }

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

const contactSchema = z.object({
  client_id: z.string().uuid(),
  first_name: z.string().trim().min(1, { error: "Enter a first name." }),
  surname: z.string().trim().min(1, { error: "Enter a surname." }),
  title: z.string().trim().nullish(),
  email: z.string().trim().email().nullish().or(z.literal("")),
  phone: z.string().trim().nullish(),
  roles: z.array(z.string()).optional(),
});

export async function createContactAction(formData: FormData): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    client_id: formData.get("client_id"),
    first_name: formData.get("first_name"),
    surname: formData.get("surname"),
    title: formData.get("title"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    roles: formData.getAll("roles"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };

  try {
    await createClientContact(
      {
        client_id: parsed.data.client_id,
        first_name: parsed.data.first_name,
        surname: parsed.data.surname,
        title: parsed.data.title || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
      },
      parsed.data.roles ?? [],
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add contact." };
  }

  revalidatePath(`/clients/${parsed.data.client_id}`);
  return { success: true };
}
