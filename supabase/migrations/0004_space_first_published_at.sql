-- Tracks whether a space has ever gone live, separately from its current
-- `status` (which flips back to 'draft' on unpublish and could flip to
-- 'published' again later). The app uses this to show a full "confirm
-- your URL" step only the very first time a space publishes, and a
-- friction-free toggle every time after — see docs/SCHEMA.md and
-- lib/actions/spaces.ts publishSpace().
alter table public.spaces
  add column first_published_at timestamptz;
