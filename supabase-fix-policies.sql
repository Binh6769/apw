-- ============================================
-- FIX EXISTING POLICIES (Skip if already exists)
-- ============================================

-- Check existing storage policies
SELECT policyname, tablename 
FROM pg_policies 
WHERE schemaname = 'storage';

-- ============================================
-- STORAGE - Add missing policies
-- ============================================

-- Only create if not exists (using DO block to check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Public can read pin-images' 
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public can read pin-images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'pin-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete own pin-images' 
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can delete own pin-images"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'pin-images' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- ============================================
-- DATABASE PINS - Add missing policies
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Authenticated users can view pins' 
    AND tablename = 'pins'
  ) THEN
    CREATE POLICY "Authenticated users can view pins"
    ON pins
    FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can create pins' 
    AND tablename = 'pins'
  ) THEN
    CREATE POLICY "Users can create pins"
    ON pins
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update own pins' 
    AND tablename = 'pins'
  ) THEN
    CREATE POLICY "Users can update own pins"
    ON pins
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete own pins' 
    AND tablename = 'pins'
  ) THEN
    CREATE POLICY "Users can delete own pins"
    ON pins
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- ALBUM PHOTOS - Add missing policies
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view own album photos' 
    AND tablename = 'album_photos'
  ) THEN
    CREATE POLICY "Users can view own album photos"
    ON album_photos
    FOR SELECT
    USING (
      auth.uid() IN (
        SELECT user_id FROM photo_albums WHERE id = album_id
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can insert album photos' 
    AND tablename = 'album_photos'
  ) THEN
    CREATE POLICY "Users can insert album photos"
    ON album_photos
    FOR INSERT
    WITH CHECK (
      auth.uid() IN (
        SELECT user_id FROM photo_albums WHERE id = album_id
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete album photos' 
    AND tablename = 'album_photos'
  ) THEN
    CREATE POLICY "Users can delete album photos"
    ON album_photos
    FOR DELETE
    USING (
      auth.uid() IN (
        SELECT user_id FROM photo_albums WHERE id = album_id
      )
    );
  END IF;
END $$;

-- ============================================
-- USER PROFILES - Add missing policies
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view all profiles' 
    AND tablename = 'user_profiles'
  ) THEN
    CREATE POLICY "Users can view all profiles"
    ON user_profiles
    FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update own profile' 
    AND tablename = 'user_profiles'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can insert own profile' 
    AND tablename = 'user_profiles'
  ) THEN
    CREATE POLICY "Users can insert own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Verify
SELECT 'Policies check complete!' as result;