import { z } from "zod";

// Validates the `items.attributes` JSONB column for spaces where
// template = 'wardrobe'. `value` (price paid) and `category` live as
// top-level columns on `items` — see docs/SCHEMA.md.
export const wardrobeAttributesSchema = z.object({
  brand: z.string().max(50).optional(),
  size: z.string().max(20).optional(),
  whereBought: z.string().max(100).optional(),
  condition: z.enum(["new", "like-new", "good", "worn"]).optional(),
});

export type WardrobeAttributes = z.infer<typeof wardrobeAttributesSchema>;

export const wardrobeTemplate = {
  key: "wardrobe" as const,
  label: "Wardrobe",
  description: "Clothing, shoes, and accessories.",
  attributesSchema: wardrobeAttributesSchema,
  fields: [
    { name: "brand", label: "Brand" },
    { name: "size", label: "Size" },
    { name: "whereBought", label: "Where bought" },
    {
      name: "condition",
      label: "Condition",
      options: ["new", "like-new", "good", "worn"],
    },
  ] as const,
};
