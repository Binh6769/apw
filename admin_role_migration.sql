-- Admin Role System Migration
-- Adds role-based access control to user_profiles table

-- Add role column (enum type simulation via text with check constraint)
alter table if exists public.user_profiles
add column if not exists role text not null default 'user' check (role in ('user', 'admin', 'banned'));

-- Add banned_until column for temporary bans
alter table if exists public.user_profiles
add column if not exists banned_until timestamptz null;

-- Add index for faster banned user lookups
create index if not exists user_profiles_role_idx on public.user_profiles(role);
create index if not exists user_profiles_banned_until_idx on public.user_profiles(banned_until);

-- Create function to check if user is admin
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = public.user_profiles.user_id
    and role = 'admin'
  );
$$ language sql security definer;

-- Create function to check if user is banned
create or replace function public.is_banned(user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = public.user_profiles.user_id
    and (
      role = 'banned'
      or banned_until is not null
    )
  );
$$ language sql security definer;

-- Create function to upgrade user to admin
create or replace function public.upgrade_to_admin(target_user_id uuid)
returns boolean as $$
  update public.user_profiles
  set role = 'admin', updated_at = now()
  where user_id = target_user_id
  and role != 'admin'
  returning true;
$$ language sql;

-- Create function to ban user
create or replace function public.ban_user(target_user_id uuid, duration_days int)
returns boolean as $$
  update public.user_profiles
  set
    role = 'banned',
    banned_until = case
      when duration_days = -1 then null
      else now() + (duration_days || ' days')::interval
    end,
    updated_at = now()
  where user_id = target_user_id
  returning true;
$$ language sql;

-- Create function to unban user
create or replace function public.unban_user(target_user_id uuid)
returns boolean as $$
  update public.user_profiles
  set
    role = 'user',
    banned_until = null,
    updated_at = now()
  where user_id = target_user_id
  and role = 'banned'
  returning true;
$$ language sql;