import { wardrobeTemplate } from "./wardrobe";
import { customTemplate } from "./custom";

// The registry every other part of the app looks templates up through —
// adding a template later is a new file + one line here, never a
// migration. See docs/SCHEMA.md "Template registry".
export const templates = {
  wardrobe: wardrobeTemplate,
  custom: customTemplate,
} as const;

export type TemplateKey = keyof typeof templates;

export const templateKeys = Object.keys(templates) as TemplateKey[];
