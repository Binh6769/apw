-- Avatar Selector Database Setup
-- Run this in Supabase SQL Editor if needed

-- 1. Ensure user_profiles table exists with avatar_url
-- This is likely already there based on your schema

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create RLS Policies for Storage

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can upload their own avatars
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can upload own avatar'
  ) THEN
    CREATE POLICY "Users can upload own avatar"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy 2: Everyone can read avatars (public)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public can read avatars'
  ) THEN
    CREATE POLICY "Public can read avatars"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Policy 3: Users can delete their own avatars
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can delete own avatar'
  ) THEN
    CREATE POLICY "Users can delete own avatar"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- 3. Create an index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_url 
ON user_profiles(avatar_url);

-- 4. Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'avatar_url';

-- 5. Check existing avatars (if any)
SELECT user_id, avatar_url, updated_at
FROM user_profiles
WHERE avatar_url IS NOT NULL
ORDER BY updated_at DESC;

-- If you need to migrate existing avatar URLs
-- UPDATE user_profiles 
-- SET avatar_url = 'new_url_here'
-- WHERE user_id = 'specific_user_id';

-- To test the RLS policies work:
-- Try uploading a file and verify it goes to avatars/user_id/...
-- Try downloading it as an anonymous user (should work)
-- Try uploading to another user's folder (should fail)
