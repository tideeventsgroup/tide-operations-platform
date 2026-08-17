"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string } | undefined;

const signInSchema = z.object({
  email: z.string().trim().email({ error: "Enter a valid email address." }),
  password: z.string().min(1, { error: "Enter your password." }),
});

export async function signIn(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Incorrect email or password." };
  }

  redirect("/dashboard");
}

const requestAccessSchema = z.object({
  firstName: z.string().trim().min(1, { error: "Enter your first name." }),
  surname: z.string().trim().min(1, { error: "Enter your surname." }),
  email: z.string().trim().email({ error: "Enter a valid email address." }),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
});

export async function requestAccess(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = requestAccessSchema.safeParse({
    firstName: formData.get("firstName"),
    surname: formData.get("surname"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  const { firstName, surname, email, password } = parsed.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, surname } },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/account-pending");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
