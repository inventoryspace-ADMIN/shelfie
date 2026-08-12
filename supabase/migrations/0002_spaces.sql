-- spaces: one row per public "space" (a wardrobe, a garage...). A single
-- account can own multiple spaces. See docs/SCHEMA.md for the full field
-- reference and the reasoning behind explicit typed theme columns.
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null,
  name text not null,
  template text not null,
  status text not null default 'draft',
  accent_color text not null default 'graphite',
  font_pairing text not null default 'modern-sans',
  background_treatment text not null default 'gallery-white',
  card_shape text not null default 'square',
  grid_density text not null default 'comfortable',
  layout_mode text not null default 'grid',
  value_display_mode text not null default 'hidden',
  value_currency text,
  og_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint slug_format check (slug ~ '^[a-z0-9-]{1,50}$'),
  constraint status_values check (status in ('draft', 'published')),
  constraint card_shape_values check (card_shape in ('square', 'rounded', 'framed')),
  constraint grid_density_values check (grid_density in ('compact', 'comfortable')),
  constraint layout_mode_values check (layout_mode in ('grid', 'list')),
  constraint value_display_mode_values check (value_display_mode in ('hidden', 'currency', 'number')),
  constraint spaces_owner_slug_unique unique (owner_id, slug)
);

create index spaces_owner_id_idx on public.spaces (owner_id);

create trigger set_spaces_updated_at
  before update on public.spaces
  for each row
  execute function public.set_updated_at();

alter table public.spaces enable row level security;

create policy "Published spaces are viewable by everyone, drafts by their owner"
  on public.spaces for select
  to anon, authenticated
  using (status = 'published' or auth.uid() = owner_id);

create policy "Users can create their own spaces"
  on public.spaces for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Users can update their own spaces"
  on public.spaces for update
  to authenticated
  using (auth.uid() = owner_id);

create policy "Users can delete their own spaces"
  on public.spaces for delete
  to authenticated
  using (auth.uid() = owner_id);
