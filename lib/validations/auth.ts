import { z } from "zod";

// Must match the `username_format` CHECK constraint in
// supabase/migrations/0001_profiles.sql — kept in sync by hand since one
// lives in SQL and the other in TypeScript.
const usernamePattern = /^[a-z0-9-]{3,30}$/;

export const usernameSchema = z
  .string()
  .toLowerCase()
  .regex(
    usernamePattern,
    "3-30 characters, lowercase letters, numbers, and hyphens only"
  );

export const signUpSchema = z.object({
  username: usernameSchema,
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "At least 8 characters"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type SignInInput = z.infer<typeof signInSchema>;
