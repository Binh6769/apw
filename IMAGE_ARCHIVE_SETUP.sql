-- Image Archive and Metadata Storage Setup
-- Run this in Supabase SQL Editor to create tables for image cataloging and labeling

-- 1. Create image_labels table (for label definitions)
CREATE TABLE IF NOT EXISTS image_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (
    category IN ('avatar', 'pin', 'profile-photo', 'user-upload', 'external-api', 'placeholder', 'system')
  ),
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create image_metadata table (for image records)
CREATE TABLE IF NOT EXISTS image_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  label_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (
    source IN ('dicebear', 'unsplash', 'jikan', 'waifu-im', 'supabase-storage', 'user-upload', 'gravatar', 'ui-avatars', 'mock-data')
  ),
  dimensions JSONB,
  file_size INTEGER,
  format TEXT CHECK (format IN ('jpg', 'png', 'gif', 'webp', 'svg', NULL)),
  color TEXT,
  alt TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pin_id UUID,
  external_id TEXT,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_label FOREIGN KEY (label_id) REFERENCES image_labels(id) ON DELETE RESTRICT
);

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_image_metadata_source ON image_metadata(source);
CREATE INDEX IF NOT EXISTS idx_image_metadata_label_id ON image_metadata(label_id);
CREATE INDEX IF NOT EXISTS idx_image_metadata_user_id ON image_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_image_metadata_pin_id ON image_metadata(pin_id);
CREATE INDEX IF NOT EXISTS idx_image_metadata_archived ON image_metadata(archived);
CREATE INDEX IF NOT EXISTS idx_image_labels_category ON image_labels(category);

-- 4. Create full-text search index for descriptions
CREATE INDEX IF NOT EXISTS idx_image_metadata_search ON image_metadata 
USING GIN (to_tsvector('english', alt || ' ' || COALESCE(notes, '')));

-- 5. Enable Row Level Security (RLS)
ALTER TABLE image_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for image_labels

-- Policy 1: Everyone can read labels
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'image_labels' 
    AND policyname = 'Everyone can read image labels'
  ) THEN
    CREATE POLICY "Everyone can read image labels"
    ON image_labels
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Policy 2: Only admin can create labels
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'image_labels' 
    AND policyname = 'Admin can manage labels'
  ) THEN
    CREATE POLICY "Admin can manage labels"
    ON image_labels
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- 7. Create RLS Policies for image_metadata

-- Policy 1: Everyone can read public image metadata
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'image_metadata' 
    AND policyname = 'Everyone can read image metadata'
  ) THEN
    CREATE POLICY "Everyone can read image metadata"
    ON image_metadata
    FOR SELECT
    USING (archived = false);
  END IF;
END $$;

-- Policy 2: Authenticated users can create image metadata
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'image_metadata' 
    AND policyname = 'Authenticated users can create image metadata'
  ) THEN
    CREATE POLICY "Authenticated users can create image metadata"
    ON image_metadata
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Policy 3: Users can update their own image metadata
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'image_metadata' 
    AND policyname = 'Users can update own image metadata'
  ) THEN
    CREATE POLICY "Users can update own image metadata"
    ON image_metadata
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Policy 4: Users can delete their own image metadata
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'image_metadata' 
    AND policyname = 'Users can delete own image metadata'
  ) THEN
    CREATE POLICY "Users can delete own image metadata"
    ON image_metadata
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- 8. Create triggers to update updated_at
CREATE OR REPLACE FUNCTION update_image_labels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS image_labels_update_timestamp ON image_labels;
CREATE TRIGGER image_labels_update_timestamp
BEFORE UPDATE ON image_labels
FOR EACH ROW
EXECUTE FUNCTION update_image_labels_updated_at();

CREATE OR REPLACE FUNCTION update_image_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS image_metadata_update_timestamp ON image_metadata;
CREATE TRIGGER image_metadata_update_timestamp
BEFORE UPDATE ON image_metadata
FOR EACH ROW
EXECUTE FUNCTION update_image_metadata_updated_at();

-- 9. Create image_sync_tracking table (for cross-page synchronization)
CREATE TABLE IF NOT EXISTS image_sync_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id TEXT NOT NULL UNIQUE,
  cache_key TEXT NOT NULL,
  source_id TEXT,
  image_url TEXT NOT NULL,
  content_hash TEXT,
  checksum TEXT,
  current_page TEXT,
  viewed_pages TEXT[] DEFAULT '{}',
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sync tracking
CREATE INDEX IF NOT EXISTS idx_image_sync_image_id ON image_sync_tracking(image_id);
CREATE INDEX IF NOT EXISTS idx_image_sync_cache_key ON image_sync_tracking(cache_key);
CREATE INDEX IF NOT EXISTS idx_image_sync_page ON image_sync_tracking(current_page);
CREATE INDEX IF NOT EXISTS idx_image_sync_accessed ON image_sync_tracking(last_accessed DESC);

-- 10. Create image_navigation_log table (for debugging navigation issues)
CREATE TABLE IF NOT EXISTS image_navigation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id TEXT NOT NULL,
  from_page TEXT NOT NULL,
  to_page TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for navigation log
CREATE INDEX IF NOT EXISTS idx_nav_log_image_id ON image_navigation_log(image_id);
CREATE INDEX IF NOT EXISTS idx_nav_log_from_page ON image_navigation_log(from_page);
CREATE INDEX IF NOT EXISTS idx_nav_log_to_page ON image_navigation_log(to_page);
CREATE INDEX IF NOT EXISTS idx_nav_log_user ON image_navigation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_nav_log_timestamp ON image_navigation_log(timestamp DESC);

-- 11. Enable RLS for new tables
ALTER TABLE image_sync_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_navigation_log ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS Policies for image_sync_tracking

-- Policy 1: Everyone can read sync tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'image_sync_tracking' 
    AND policyname = 'Everyone can read sync tracking'
  ) THEN
    CREATE POLICY "Everyone can read sync tracking"
    ON image_sync_tracking
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Policy 2: System can create/update sync tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'image_sync_tracking' 
    AND policyname = 'System can manage sync tracking'
  ) THEN
    CREATE POLICY "System can manage sync tracking"
    ON image_sync_tracking
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 13. Create RLS Policies for image_navigation_log

-- Policy 1: Users can read their own navigation logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'image_navigation_log' 
    AND policyname = 'Users can read own navigation logs'
  ) THEN
    CREATE POLICY "Users can read own navigation logs"
    ON image_navigation_log
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Policy 2: System can create navigation logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'image_navigation_log' 
    AND policyname = 'System can create navigation logs'
  ) THEN
    CREATE POLICY "System can create navigation logs"
    ON image_navigation_log
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- 14. Create triggers to update sync tracking timestamps
CREATE OR REPLACE FUNCTION update_image_sync_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_accessed = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS image_sync_update_timestamp ON image_sync_tracking;
CREATE TRIGGER image_sync_update_timestamp
BEFORE UPDATE ON image_sync_tracking
FOR EACH ROW
EXECUTE FUNCTION update_image_sync_timestamp();

-- 15. Insert pre-defined image labels
INSERT INTO image_labels (name, category, tags, description)
VALUES
  -- Avatar labels
  ('User Avatar (Small)', 'avatar', ARRAY['avatar', 'user', 'small'], 'Small avatar in header/nav'),
  ('User Avatar (Medium)', 'avatar', ARRAY['avatar', 'user', 'medium'], 'Medium avatar in menus'),
  ('User Avatar (Large)', 'avatar', ARRAY['avatar', 'user', 'large'], 'Large avatar on profile'),
  ('Generated Avatar', 'avatar', ARRAY['avatar', 'generated', 'dicebear'], 'Auto-generated from DiceBear'),
  ('Uploaded Avatar', 'avatar', ARRAY['avatar', 'user-upload', 'custom'], 'User-uploaded avatar'),
  
  -- Pin labels
  ('Pin Image (Grid)', 'pin', ARRAY['pin', 'grid', 'masonry'], 'Pin in grid/masonry view'),
  ('Pin Image (Detail)', 'pin', ARRAY['pin', 'detail', 'full-size'], 'Pin in detail view'),
  ('Pin Placeholder', 'pin', ARRAY['pin', 'placeholder', 'color'], 'Dominant color placeholder'),
  
  -- Creator labels
  ('Creator Avatar', 'external-api', ARRAY['creator', 'avatar'], 'Creator avatar in pin detail'),
  
  -- External API labels
  ('Unsplash Image', 'external-api', ARRAY['unsplash', 'photo'], 'Image from Unsplash API'),
  ('Anime Image (Jikan)', 'external-api', ARRAY['jikan', 'anime'], 'Anime from Jikan API'),
  ('Waifu Image', 'external-api', ARRAY['waifu', 'anime'], 'Waifu from Waifu.im API'),
  
  -- System labels
  ('Fallback Image', 'system', ARRAY['fallback', 'error'], 'Fallback on error'),
  ('Logo/Branding', 'system', ARRAY['logo', 'branding'], 'Application logo'),
  ('Icon Image', 'system', ARRAY['icon', 'ui'], 'UI icon or symbol')
ON CONFLICT (name) DO NOTHING;

-- 16. Verify all tables exist
SELECT 
  tablename,
  (SELECT count(*) FROM pg_indexes WHERE tablename = pg_tables.tablename) as index_count
FROM pg_tables
WHERE tablename IN ('image_labels', 'image_metadata', 'image_sync_tracking', 'image_navigation_log')
ORDER BY tablename;

-- 17. Count pre-defined labels
SELECT COUNT(*) as total_labels, 
       array_agg(DISTINCT category) as categories
FROM image_labels;

-- 18. Check all RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles
FROM pg_policies
WHERE tablename IN ('image_labels', 'image_metadata', 'image_sync_tracking', 'image_navigation_log')
ORDER BY tablename, policyname;

-- 19. View table structure for image_sync_tracking
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'image_sync_tracking'
ORDER BY ordinal_position;
