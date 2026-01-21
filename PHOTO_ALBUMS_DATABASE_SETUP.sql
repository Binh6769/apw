-- Create photo_albums table for organizing saved images
CREATE TABLE IF NOT EXISTS photo_albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create album_photos junction table
CREATE TABLE IF NOT EXISTS album_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_title TEXT,
  photo_width INTEGER,
  photo_height INTEGER,
  photo_color TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(album_id, photo_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photo_albums_user_id ON photo_albums(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_albums_created_at ON photo_albums(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_added_at ON album_photos(album_id, added_at DESC);

-- Enable RLS
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photo_albums
CREATE POLICY "Users can view their own albums"
  ON photo_albums
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own albums"
  ON photo_albums
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums"
  ON photo_albums
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums"
  ON photo_albums
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for album_photos
CREATE POLICY "Users can view their own album photos"
  ON album_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM photo_albums 
      WHERE photo_albums.id = album_photos.album_id 
      AND (photo_albums.user_id = auth.uid() OR photo_albums.is_public = true)
    )
  );

CREATE POLICY "Users can add photos to their own albums"
  ON album_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM photo_albums 
      WHERE photo_albums.id = album_photos.album_id 
      AND photo_albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos from their own albums"
  ON album_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM photo_albums 
      WHERE photo_albums.id = album_photos.album_id 
      AND photo_albums.user_id = auth.uid()
    )
  );
