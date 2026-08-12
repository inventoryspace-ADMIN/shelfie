import { itemAttributesSchema } from "./attributes";

export const customTemplate = {
  key: "custom" as const,
  label: "Custom",
  description: "Anything else — you define the fields per item.",
  attributesSchema: itemAttributesSchema,
};
