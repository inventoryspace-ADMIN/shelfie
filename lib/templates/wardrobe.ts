import { itemAttributesSchema } from "./attributes";

export const wardrobeTemplate = {
  key: "wardrobe" as const,
  label: "Wardrobe",
  description: "Clothing, shoes, and accessories.",
  attributesSchema: itemAttributesSchema,
};
