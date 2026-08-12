-- items: one row per cataloged item inside a space. See docs/SCHEMA.md.
create table public.items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null,
  description text,
  category text,
  value numeric,
  primary_image_path text not null,
  hover_image_path text,
  outbound_url text,
  attributes jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint title_length check (char_length(title) between 1 and 100)
);

create index items_space_id_idx on public.items (space_id);
create index items_space_id_sort_order_idx on public.items (space_id, sort_order);

create trigger set_items_updated_at
  before update on public.items
  for each row
  execute function public.set_updated_at();

alter table public.items enable row level security;

create policy "Items are viewable when their space is published or owned"
  on public.items for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.spaces
      where spaces.id = items.space_id
        and (spaces.status = 'published' or spaces.owner_id = auth.uid())
    )
  );

create policy "Owners can insert items into their own spaces"
  on public.items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.spaces
      where spaces.id = items.space_id
        and spaces.owner_id = auth.uid()
    )
  );

create policy "Owners can update items in their own spaces"
  on public.items for update
  to authenticated
  using (
    exists (
      select 1 from public.spaces
      where spaces.id = items.space_id
        and spaces.owner_id = auth.uid()
    )
  );

create policy "Owners can delete items in their own spaces"
  on public.items for delete
  to authenticated
  using (
    exists (
      select 1 from public.spaces
      where spaces.id = items.space_id
        and spaces.owner_id = auth.uid()
    )
  );

-- space-images bucket: holds every item's photos plus (later) generated
-- OG images. Public read — the public space page and link-preview
-- crawlers both need to load images with no auth. Writes are restricted
-- to authenticated users, scoped to a path prefixed with their own
-- auth.uid(), e.g. {owner_id}/{space_id}/{item_id}/primary.png.
insert into storage.buckets (id, name, public)
values ('space-images', 'space-images', true)
on conflict (id) do nothing;

create policy "space-images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'space-images');

create policy "Owners can upload into their own space-images folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'space-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can update their own space-images files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'space-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can delete their own space-images files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'space-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
