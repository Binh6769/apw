-- Global Categories System
-- Creates a normalized categories table + pin_categories junction table
-- and migrates existing comma-separated category data into the new structure

-- Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create pin_categories junction table
create table if not exists public.pin_categories (
  pin_id uuid not null references public.pins(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (pin_id, category_id)
);

-- Indexes for faster lookups
create index if not exists pin_categories_category_id_idx on public.pin_categories(category_id);
create index if not exists pin_categories_pin_id_idx on public.pin_categories(pin_id);

-- Migrate existing comma-separated categories into the categories table
insert into public.categories (name, slug)
select distinct
  trim(tag) as name,
  lower(replace(trim(tag), ' ', '-')) as slug
from public.pins,
  lateral unnest(string_to_array(category, ',')) as tags(tag)
where category is not null and trim(tag) != ''
on conflict (slug) do nothing;

-- Create pin_categories associations for existing pins
insert into public.pin_categories (pin_id, category_id)
select distinct p.id, c.id
from public.pins p
  cross join lateral unnest(string_to_array(p.category, ',')) as tags(tag)
  join public.categories c on c.slug = lower(replace(trim(tags.tag), ' ', '-'))
where p.category is not null and trim(tags.tag) != '';

-- RLS policies
alter table public.categories enable row level security;
alter table public.pin_categories enable row level security;

-- Categories: anyone can read
create policy "Anyone can read categories"
  on public.categories for select
  using (true);

-- Categories: authenticated users can insert
create policy "Authenticated users can create categories"
  on public.categories for insert
  with check (auth.role() = 'authenticated');

-- Categories: authenticated users can update
create policy "Authenticated users can update categories"
  on public.categories for update
  using (auth.role() = 'authenticated');

-- Categories: only admins can delete
create policy "Only admins can delete categories"
  on public.categories for delete
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Pin_categories: anyone can read
create policy "Anyone can read pin_categories"
  on public.pin_categories for select
  using (true);

-- Pin_categories: authenticated users can insert/update/delete
create policy "Authenticated users can manage pin_categories"
  on public.pin_categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
