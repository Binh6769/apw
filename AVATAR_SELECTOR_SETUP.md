# Avatar Selector Feature - Setup Guide

## Overview
Tính năng Avatar Selector cho phép người dùng chọn avatar từ các nguồn khác nhau:
- **DiceBear API**: Nhiều style avatar được tạo động
- **Preset Sources**: UI Avatars, Gravatar Style
- **Upload**: Tải lên avatar tùy chỉnh

## Components Created

### 1. AvatarSelector Component
**File**: `src/components/AvatarSelector.tsx`

Features:
- 3 tabs: Generated (DiceBear), Preset Sources, Upload
- Real-time preview
- Supabase Storage integration
- Auto-save to user profile

### 2. Updated Profile Page
**File**: `src/pages/Profile.tsx`

Changes:
- Added AvatarSelector import
- Added Camera icon overlay on avatar
- Avatar is clickable to open selector modal
- Auto-refresh on avatar change

## Setup Instructions

### Step 1: Ensure Supabase Storage is Configured

In your Supabase project dashboard:
1. Go to **Storage** in the sidebar
2. Create a new bucket called `avatars`
3. Set bucket to **Public** so avatars are accessible
4. Add CORS policy if needed

### Step 2: Update your RLS Policies

For Storage bucket `avatars`, set these RLS policies:

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read
CREATE POLICY "Public can read avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### Step 3: Verify Database Schema

Ensure your `user_profiles` table has:
```sql
avatar_url TEXT
```

This is already in place based on your current setup.

## Usage

### For End Users
1. Navigate to Profile page
2. Hover over avatar and click the camera icon
3. Choose avatar source:
   - **Generated**: Select from 6 DiceBear styles
   - **Preset**: Choose from pre-built avatar generators
   - **Upload**: Upload your own image (JPG, PNG, GIF)
4. Click "Done" to save

### For Developers

Basic usage:
```tsx
import { AvatarSelector } from '../components/AvatarSelector';

<AvatarSelector
  userId={user.id}
  currentAvatarUrl={userProfile?.avatar_url}
  onAvatarChange={(url) => {
    setUserProfile({ ...userProfile, avatar_url: url });
  }}
  onClose={() => setShowAvatarSelector(false)}
/>
```

## API Integration with Supabase MCP

The component uses these Supabase services:

### 1. DiceBear API (Free, No Auth Required)
```
https://api.dicebear.com/7.x/{style}/svg?seed={userId}
```
Styles available:
- avataaars
- pixel-art
- adventurer
- big-ears
- croodles
- initials

### 2. Supabase Storage (For Uploaded Images)
```typescript
// Upload
const { error } = await supabase.storage
  .from('avatars')
  .upload(`avatars/${fileName}`, file);

// Get Public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(filePath);
```

### 3. User Profile Service (For Persistence)
```typescript
await updateUserProfile(userId, {
  avatar_url: url,
});
```

## Avatar Sources Available

### DiceBear Styles
- **avataaars**: Cartoon-style avatars with customizable features
- **pixel-art**: Retro pixel art style
- **adventurer**: D&D adventurer style
- **big-ears**: Cute characters with big ears
- **croodles**: Cute minimalist characters
- **initials**: User initials based avatar

### Preset Sources
- **UI Avatars**: Generate initials-based avatars
- **Gravatar Style**: Gravatar-compatible avatars

## File Upload Details

- **Max size**: 10MB (configurable)
- **Accepted types**: JPG, PNG, GIF, WebP
- **Storage path**: `avatars/{userId}-{timestamp}.{ext}`
- **Accessibility**: Public (images visible to everyone)

## Error Handling

The component handles:
- Upload failures with user-friendly messages
- Network errors
- Invalid file types
- Storage quota exceeded

## Performance Considerations

1. **Lazy loading**: Avatar images use `loading="lazy"`
2. **Modal optimization**: Component unmounts when closed
3. **No external dependencies**: Uses existing Supabase client
4. **Efficient re-renders**: Only updates on selection

## Future Enhancements

Possible improvements:
1. Image cropping before upload
2. Avatar preview with different sizes
3. Social media avatar import (Facebook, Google)
4. Animated avatars
5. Avatar search/filtering
6. Custom avatar creation builder

## Testing

Test the feature:
1. ✅ Load profile page
2. ✅ Hover over avatar → camera icon appears
3. ✅ Click camera → modal opens
4. ✅ Switch between tabs
5. ✅ Select generated avatar → auto-saves
6. ✅ Upload image → file appears in storage
7. ✅ Verify avatar updates in Supabase
8. ✅ Refresh page → avatar persists

## Troubleshooting

### Avatar not saving
- Check Supabase connection in `src/services/supabase.ts`
- Verify RLS policies on `user_profiles` table

### Storage bucket not found
- Create `avatars` bucket in Supabase Storage
- Check bucket name spelling

### Images not loading
- Verify bucket is set to **Public**
- Check CORS settings
- Verify file paths are correct

### Upload fails
- Check file size < 10MB
- Verify file type is supported
- Check storage quota

## Database Queries Used

```typescript
// Update user profile with avatar URL
UPDATE user_profiles 
SET avatar_url = $1, updated_at = NOW()
WHERE user_id = $2
RETURNING *;
```

## Security Notes

✅ **Secure**:
- User can only upload to their own avatar folder
- RLS policies enforce authorization
- Files are scanned for malware (Supabase feature)
- Public read prevents unintended access

## Related Files

- `src/components/AvatarSelector.tsx` - Main component
- `src/pages/Profile.tsx` - Integration point
- `src/services/userProfileService.ts` - Database service
- `src/services/supabase.ts` - Supabase client
- Database schema with `user_profiles.avatar_url`
