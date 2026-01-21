# Supabase MCP Integration & Avatar Selector Setup

## Quick Start

### 1. Create Supabase Storage Bucket

Go to your Supabase Dashboard:
1. Navigate to **Storage** section
2. Click **Create new bucket**
3. Name it: `avatars`
4. Make it **Public**
5. Click **Create bucket**

### 2. Verify your .env.local

Check that you have:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Test Avatar Selector

Run your app:
```bash
npm run dev
```

Navigate to Profile page and try:
- Hover over avatar → click camera icon
- Select from DiceBear styles
- Try uploading an image

## Complete Setup with RLS Policies

### Create RLS Policies in SQL Editor

Go to **SQL Editor** in Supabase and run:

```sql
-- Drop existing policies if needed
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Anyone can read avatars
CREATE POLICY "Public can read avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Policy 3: Users can delete their own files
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Feature Overview

### Avatar Sources

1. **DiceBear API** (Generated)
   - 6 different styles
   - Unique per user
   - Instant generation
   - No upload needed

2. **Preset Sources**
   - UI Avatars (initials)
   - Gravatar style
   - Quick selection

3. **Custom Upload**
   - JPG, PNG, GIF, WebP
   - Max 10MB
   - Stored in Supabase
   - Instant preview

### Component Features

✅ Modal dialog interface
✅ Tab-based navigation
✅ Real-time preview
✅ Automatic save to database
✅ File upload with progress
✅ Error handling
✅ Loading states
✅ Responsive design

## Database Schema

Your `user_profiles` table should have:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,  -- This stores the avatar URL
  bio TEXT,
  phone TEXT,
  location TEXT,
  website TEXT,
  birth_date DATE,
  age INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## File Structure

```
src/
├── components/
│   └── AvatarSelector.tsx (NEW)
├── pages/
│   └── Profile.tsx (UPDATED)
├── services/
│   ├── supabase.ts
│   └── userProfileService.ts
└── types/
    └── index.ts
```

## Usage Examples

### From Profile Component
```tsx
import { AvatarSelector } from '../components/AvatarSelector';

// In your component
const [showAvatarSelector, setShowAvatarSelector] = useState(false);

<AvatarSelector
  userId={user.id}
  currentAvatarUrl={userProfile?.avatar_url}
  onAvatarChange={(url) => {
    setUserProfile({ ...userProfile, avatar_url: url });
  }}
  onClose={() => setShowAvatarSelector(false)}
/>
```

## API Endpoints Used

### DiceBear (No Auth)
```
GET https://api.dicebear.com/7.x/{style}/svg?seed={userId}
```

### Supabase Storage
```
POST /storage/v1/object/avatars/{filePath}
GET /storage/v1/object/public/avatars/{filePath}
```

### User Profile Service
```
SELECT * FROM user_profiles WHERE user_id = {userId}
UPDATE user_profiles SET avatar_url = {url} WHERE user_id = {userId}
```

## Env Variables Needed

None additional! Uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Troubleshooting

### Issue: "Cannot read storage bucket"
**Solution**: 
1. Create `avatars` bucket in Supabase Storage
2. Make it **Public**
3. Refresh page

### Issue: "Upload fails silently"
**Solution**:
1. Check browser console for errors
2. Verify file size < 10MB
3. Check RLS policies are set correctly
4. Verify CORS settings

### Issue: "Avatar doesn't save to database"
**Solution**:
1. Verify user is authenticated
2. Check `user_profiles` table exists
3. Verify `avatar_url` column exists
4. Check RLS policies on `user_profiles`

### Issue: "Generated avatars don't load"
**Solution**:
1. Check internet connection
2. DiceBear API might be down
3. Try refresh page
4. Switch to different source

## Testing Checklist

- [ ] Profile page loads
- [ ] Avatar displays
- [ ] Camera icon appears on hover
- [ ] Click camera opens modal
- [ ] DiceBear tab shows 6 styles
- [ ] Preset tab shows 2 sources
- [ ] Can upload image
- [ ] Upload saves to Supabase Storage
- [ ] Avatar URL saved to database
- [ ] Avatar persists after page refresh
- [ ] Works on mobile view

## Performance Tips

1. Images use lazy loading
2. Component unmounts on close
3. No external dependencies
4. Efficient state management
5. Minimal re-renders

## Security

✅ **Protected**:
- Only authenticated users can upload
- Users can only modify their own avatar
- RLS policies enforce ownership
- Public read allows avatar display

## Next Steps

1. ✅ Created `AvatarSelector.tsx` component
2. ✅ Updated `Profile.tsx` to use it
3. ✅ Added documentation
4. ⏳ Create Supabase storage bucket
5. ⏳ Set RLS policies
6. ⏳ Test the feature

## Support

For issues with:
- **Supabase**: Check [supabase.com/docs](https://supabase.com/docs)
- **DiceBear API**: Visit [dicebear.com](https://www.dicebear.com)
- **UI Avatars**: Visit [ui-avatars.com](https://ui-avatars.com)
