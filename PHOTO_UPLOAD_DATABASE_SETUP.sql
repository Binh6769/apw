-- Photo Upload Feature - Database Setup
-- Run this in Supabase SQL Editor

-- 1. Ensure user_profiles table has avatar_url column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create RLS Policies for profile-photos bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can upload their own profile photos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can upload own profile photo'
  ) THEN
    CREATE POLICY "Users can upload own profile photo"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'profile-photos' 
      AND (storage.foldername(name))[1] = 'profile-photos'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy 2: Everyone can read profile photos (public)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public can read profile photos'
  ) THEN
    CREATE POLICY "Public can read profile photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'profile-photos');
  END IF;
END $$;

-- Policy 3: Users can delete their own profile photos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can delete own profile photos'
  ) THEN
    CREATE POLICY "Users can delete own profile photos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'profile-photos'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;
END $$;

-- 3. Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_url 
ON user_profiles(avatar_url);

-- 4. Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
AND column_name IN ('avatar_url', 'user_id')
ORDER BY ordinal_position;

-- 5. Check existing photos (if any)
SELECT user_id, avatar_url, updated_at
FROM user_profiles
WHERE avatar_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- 6. View RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND bucket_id = 'profile-photos'
ORDER BY policyname;

-- If you need to reset all photos for a user:
-- UPDATE user_profiles 
-- SET avatar_url = NULL 
-- WHERE user_id = 'specific_user_id';

-- If you need to delete old photos before migration:
-- To be done via Supabase Storage UI or API

-- Verify storage bucket permissions
-- This should show public access for profile-photos
SELECT 
  name,
  id,
  owner,
  public,
  created_at
FROM storage.buckets
WHERE name = 'profile-photos';
