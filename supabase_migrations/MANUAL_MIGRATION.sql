-- =====================================================
-- ADMIN ROLE SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add role column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'banned'));

-- 2. Add banned_until column
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS banned_until timestamptz NULL;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_banned_until_idx ON public.user_profiles(banned_until);

-- 4. Create is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(target_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = target_user_id
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Create is_banned function
CREATE OR REPLACE FUNCTION public.is_banned(target_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = target_user_id
    AND (role = 'banned' OR banned_until IS NOT NULL)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Create upgrade_to_admin function
CREATE OR REPLACE FUNCTION public.upgrade_to_admin(target_user_id uuid)
RETURNS boolean AS $$
  UPDATE public.user_profiles
  SET role = 'admin', updated_at = now()
  WHERE user_id = target_user_id
  AND role != 'admin'
  RETURNING true;
$$ LANGUAGE sql;

-- 7. Create ban_user function
CREATE OR REPLACE FUNCTION public.ban_user(target_user_id uuid, duration_days int)
RETURNS boolean AS $$
  UPDATE public.user_profiles
  SET 
    role = 'banned',
    banned_until = CASE 
      WHEN duration_days = -1 THEN NULL
      ELSE now() + (duration_days || ' days')::interval
    END,
    updated_at = now()
  WHERE user_id = target_user_id
  RETURNING true;
$$ LANGUAGE sql;

-- 8. Create unban_user function
CREATE OR REPLACE FUNCTION public.unban_user(target_user_id uuid)
RETURNS boolean AS $$
  UPDATE public.user_profiles
  SET 
    role = 'user',
    banned_until = NULL,
    updated_at = now()
  WHERE user_id = target_user_id
  AND role = 'banned'
  RETURNING true;
$$ LANGUAGE sql;

-- =====================================================
-- DELETE ALL EXTERNAL IMAGES
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Delete saved_images for non-UUID pins (external)
DELETE FROM public.saved_images 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 2. Delete likes for external pins
DELETE FROM public.likes 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 3. Delete loves for external pins
DELETE FROM public.loves 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 4. Delete comments for external pins
DELETE FROM public.comments 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 5. Delete all external pins (prefixed IDs like art-*, reddit-*, etc)
DELETE FROM public.pins 
WHERE id NOT LIKE '______-______-____-____-____________';

-- 6. Check remaining user images
SELECT COUNT(*) as user_images_remaining FROM public.pins 
WHERE id LIKE '______-______-____-____-____________';