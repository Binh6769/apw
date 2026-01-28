# Database Schema

## Tables Overview

| Table | Purpose |
|-------|---------|
| `user_profiles` | User profile information |
| `pins` | Created pins |
| `saved_pins` | Bookmarked/saved pins |
| `photo_albums` | Album collections |
| `comments` | Pin comments |
| `image_metadata` | Image tracking data |
| `image_labels` | Image categorization |
| `image_sync_tracking` | Navigation sync state |
| `image_navigation_log` | Navigation history |

## Schema Definitions

### user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  website TEXT,
  birth_date DATE,
  age INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### image_labels
```sql
CREATE TABLE image_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT, -- avatar|pin|external-api|system
  tags TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### image_metadata
```sql
CREATE TABLE image_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID REFERENCES image_labels,
  url TEXT NOT NULL,
  source TEXT,
  dimensions JSONB,
  format TEXT,
  color TEXT,
  user_id UUID REFERENCES auth.users,
  pin_id UUID,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### image_sync_tracking
```sql
CREATE TABLE image_sync_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id TEXT NOT NULL,
  cache_key TEXT,
  current_page TEXT,
  viewed_pages TEXT[],
  access_count INTEGER DEFAULT 1,
  synced BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### comments
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### photo_albums
```sql
CREATE TABLE photo_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## RLS Policies

### user_profiles
- SELECT: Everyone (public profiles)
- INSERT: Own profile only (`auth.uid() = user_id`)
- UPDATE: Own profile only
- DELETE: Own profile only

### image_metadata
- SELECT: Everyone (non-archived)
- INSERT: Authenticated users
- UPDATE/DELETE: Own records or admin

### comments
- SELECT: Everyone
- INSERT: Authenticated users
- UPDATE/DELETE: Own comments only

## Storage Buckets

### avatars (Public)
- Purpose: User avatar images
- Path: `{user_id}/{user_id}-{timestamp}.{ext}`
- RLS: Users can upload/delete own; public read

### pins (Public)
- Purpose: Uploaded pin images
- Path: `{user_id}/{pin_id}.{ext}`
- RLS: Users can upload/delete own; public read
