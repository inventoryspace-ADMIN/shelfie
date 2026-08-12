import { z } from "zod";

// Every template shares this one open-ended shape for "extra details" —
// the owner defines their own label/value pairs per item rather than the
// app prescribing fixed fields per template (e.g. "Wardrobe means Size
// and Condition"). Capped at 10 fields so the form and the eventual
// public card layout stay predictable.
export const itemAttributesSchema = z.object({
  fields: z
    .array(
      z.object({
        label: z.string().min(1).max(40),
        value: z.string().min(1).max(200),
      })
    )
    .max(10),
});

export type ItemAttributes = z.infer<typeof itemAttributesSchema>;
