"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  signInSchema,
  signUpSchema,
  usernameSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validations/auth";

export async function checkUsernameAvailable(
  rawUsername: string
): Promise<boolean> {
  const parsed = usernameSchema.safeParse(rawUsername);
  if (!parsed.success) return false;

  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("username", parsed.data);

  return count === 0;
}

export async function signUp(
  input: SignUpInput
): Promise<{ error: string } | { message: string } | undefined> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { username, email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    // Postgres raises a unique-violation from the `profiles.username`
    // constraint via the on_auth_user_created trigger if the live check
    // was bypassed or lost a race — translate it to a plain message.
    if (error.message.toLowerCase().includes("duplicate key")) {
      return { error: "That username is already taken." };
    }
    return { error: error.message };
  }

  // If the Supabase project requires email confirmation, signUp succeeds
  // but returns no session — there's nothing to redirect into yet.
  if (!data.session) {
    return { message: "Check your email to confirm your account, then sign in." };
  }

  redirect("/dashboard");
}

export async function signIn(
  input: SignInInput
): Promise<{ error: string } | undefined> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Incorrect email or password." };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
