// Turns a display name into a URL-safe suggestion, e.g. "My Wardrobe!" ->
// "my-wardrobe". Owners can still edit the result — this just seeds it.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
