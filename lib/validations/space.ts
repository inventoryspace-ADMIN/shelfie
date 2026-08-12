import { z } from "zod";
import { templateKeys } from "@/lib/templates";

// Must match the `slug_format` CHECK constraint in
// supabase/migrations/0002_spaces.sql.
export const spaceSlugSchema = z
  .string()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,50}$/, "Lowercase letters, numbers, and hyphens only");

export const createSpaceSchema = z.object({
  name: z.string().min(1, "Required").max(100),
  slug: spaceSlugSchema,
  template: z.enum(templateKeys as [string, ...string[]]),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;

export const renameSpaceSchema = z.object({
  spaceId: z.string().uuid(),
  name: z.string().min(1, "Required").max(100),
});

export type RenameSpaceInput = z.infer<typeof renameSpaceSchema>;
