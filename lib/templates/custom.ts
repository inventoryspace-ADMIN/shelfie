import { z } from "zod";

// Validates the `items.attributes` JSONB column for spaces where
// template = 'custom' — for anything without a dedicated template yet.
// The owner defines their own label/value pairs per item.
export const customAttributesSchema = z.object({
  fields: z
    .array(
      z.object({
        label: z.string().min(1).max(40),
        value: z.string().min(1).max(200),
      })
    )
    .max(10),
});

export type CustomAttributes = z.infer<typeof customAttributesSchema>;

export const customTemplate = {
  key: "custom" as const,
  label: "Custom",
  description: "Anything else — you define the fields per item.",
  attributesSchema: customAttributesSchema,
};
