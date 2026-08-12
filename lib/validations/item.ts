import { z } from "zod";

// Common fields every item has, regardless of template. Template-specific
// fields (attributes) are validated separately against the matching
// schema in lib/templates/ once the caller knows which template applies —
// see lib/actions/items.ts.
export const itemBaseSchema = z.object({
  spaceId: z.string().uuid(),
  title: z.string().min(1, "Required").max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().max(50).optional().or(z.literal("")),
  value: z.number().nonnegative().optional(),
  outboundUrl: z
    .string()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
  primaryImagePath: z.string().min(1, "Add a photo"),
  hoverImagePath: z.string().optional().or(z.literal("")),
});

export type ItemBaseInput = z.infer<typeof itemBaseSchema>;

export const updateItemBaseSchema = itemBaseSchema.extend({
  itemId: z.string().uuid(),
});

export type UpdateItemBaseInput = z.infer<typeof updateItemBaseSchema>;
