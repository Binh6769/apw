-- Create image_history table to track all images viewed by users
CREATE TABLE IF NOT EXISTS image_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_title TEXT,
  image_width INTEGER,
  image_height INTEGER,
  image_color TEXT,
  image_description TEXT,
  source TEXT, -- 'unsplash', 'pin', 'external', etc.
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, image_id)
);

-- Create index on user_id and viewed_at for faster queries
CREATE INDEX IF NOT EXISTS idx_image_history_user_viewed ON image_history(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_history_user_id ON image_history(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE image_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own history
CREATE POLICY "Users can view their own image history"
  ON image_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own history entries
CREATE POLICY "Users can create their own image history"
  ON image_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own history entries
CREATE POLICY "Users can delete their own image history"
  ON image_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own history entries (e.g., update viewed_at)
CREATE POLICY "Users can update their own image history"
  ON image_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
