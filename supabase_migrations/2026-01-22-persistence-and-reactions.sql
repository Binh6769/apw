-- Saved images are kept separate from created pins
create table if not exists public.saved_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_id uuid not null references public.pins(id) on delete cascade,
  saved_at timestamptz not null default now(),
  unique (user_id, pin_id)
);

create index if not exists saved_images_user_id_saved_at_idx on public.saved_images(user_id, saved_at desc);

-- Reactions with single-like/love constraint per user
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_id uuid not null references public.pins(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, pin_id)
);
create index if not exists likes_pin_id_idx on public.likes(pin_id);

create table if not exists public.loves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_id uuid not null references public.pins(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, pin_id)
);
create index if not exists loves_pin_id_idx on public.loves(pin_id);

-- Persistent comments tied to the image id
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_id uuid not null references public.pins(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comments_pin_id_created_at_idx on public.comments(pin_id, created_at desc);

-- UI appearance preferences synced per user
create table if not exists public.ui_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- History accuracy / faster lookups
create index if not exists image_history_image_id_idx on public.image_history(image_id);
