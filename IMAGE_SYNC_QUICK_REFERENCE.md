# 📸 Image Sync - Quick Reference

## Current Image References

### User Avatar Pattern
```tsx
// Always use this pattern for user avatars:
user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id
```

### Profile Avatar Pattern
```tsx
// For profile avatars:
userProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.id
```

### Pin Image Pattern
```tsx
// For pin images:
photo.urls.regular    // In grids/cards
photo.urls.full       // In detail view
```

### Pin Color Pattern
```tsx
// For dominant color placeholder:
style={{ backgroundColor: photo.color || '#e8e8e8' }}
```

---

## Where Each Image Type Appears

| Image Type | Components | Data Source |
|-----------|-----------|-----------|
| **User Avatar (Small)** | Header button, MobileNav | `user.user_metadata?.avatar_url` |
| **User Avatar (Medium)** | Header menu | `user.user_metadata?.avatar_url` |
| **User Avatar (Large)** | Profile page | `userProfile?.avatar_url` |
| **User Avatar (Settings)** | Settings preview | `formData.avatarUrl` |
| **Pin Image (Grid)** | PinCard, MasonryGrid | `photo.urls.regular` |
| **Pin Image (Detail)** | PinDetail | `photo.urls.full` |
| **Creator Avatar** | PinDetail | `photo.user.profile_image.medium` |
| **Placeholder Color** | All pin containers | `photo.color` |

---

## Adding New Image References

### For User Avatar:
```tsx
<img 
  src={user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}
  alt={user.email}
  className="w-X h-X rounded-full"
/>
```

### For Pin Image:
```tsx
<img
  src={photo.urls.regular}  // or photo.urls.full for detail view
  alt={photo.alt_description || 'Pin'}
  className="w-full h-full object-cover"
  loading="lazy"
/>
```

---

## Data Sources

### User Avatars
- **Table:** `public.user_profiles`
- **Column:** `avatar_url`
- **Fetched by:** `useAuth()` hook, `getUserProfile()` service
- **Updated at:** Settings page via `updateUserProfile()`

### Pin Images
- **Table:** `public.pins`
- **Column:** `image_url` (Supabase Storage public URL)
- **Fetched by:** `pinsService` functions
- **Updated at:** CreatePin page via `uploadImage()`

### Pin Colors
- **Table:** `public.pins`
- **Column:** `image_color`
- **Generated:** During pin creation via canvas color extraction
- **Used:** Placeholder background while image loads

---

## Troubleshooting

### Avatar Not Showing
1. Check user is authenticated: `useAuth()` returns user
2. Verify user_metadata has avatar_url: `user.user_metadata?.avatar_url`
3. Check DiceBear URL is correct: `https://api.dicebear.com/7.x/avataaars/svg?seed={userId}`
4. Network tab: Confirm image URLs load (no 404 errors)

### Pin Image Not Showing
1. Verify pin.image_url is valid URL
2. Check Supabase Storage bucket public access
3. Verify image file exists in bucket
4. Check RLS policies allow read access
5. Network tab: Confirm image URLs return 200 status

### Color Placeholder Not Showing
1. Verify photo.color is in hex format (#RRGGBB)
2. Check CSS is applying background color
3. Verify image takes time to load (color shows during load)

---

## Performance Tips

### ✅ Do This:
- Use `loading="lazy"` for images below fold
- Set proper `className` sizes to avoid layout shift
- Use `backgroundColor` placeholder for pins
- Serve images from Supabase Storage (already optimized)

### ❌ Don't Do This:
- Hardcode image URLs (use database fields)
- Forget fallback avatars (always use DiceBear)
- Load high-res images in grids (use .regular not .full)
- Skip color placeholders (causes CLS)

---

## Image Size Guidelines

| Location | Width | Height | Class |
|----------|-------|--------|-------|
| Header avatar | 6px | 6px | `w-6 h-6` |
| Header menu avatar | 10px | 10px | `w-10 h-10` |
| MobileNav avatar | 6px | 6px | `w-6 h-6` |
| Settings avatar | 20px | 20px | `w-20 h-20` |
| Profile avatar | 32px | 32px | `w-32 h-32` |
| PinCard | Full width | Auto (aspect-ratio) | `w-full` |
| PinDetail | Full width | Auto | `w-full h-full` |

---

## Database Query Examples

### Fetch User with Avatar
```typescript
const { data: { user } } = await supabase.auth.getUser();
// Returns: user.user_metadata?.avatar_url
```

### Fetch Pins with Colors and Dimensions
```typescript
const { data } = await supabase
  .from('pins')
  .select('image_url, image_color, image_width, image_height');
// Returns: image_url (string), image_color (hex), image_width (int), image_height (int)
```

### Fetch User Profile with Avatar
```typescript
const { data } = await supabase
  .from('user_profiles')
  .select('avatar_url, first_name, last_name')
  .eq('user_id', userId)
  .single();
// Returns: avatar_url (string or null)
```

---

## Migration Checklist

When updating to real images in any new component:

- [ ] Import `useAuth()` for user avatars
- [ ] Get pin data from service (not hardcoded)
- [ ] Use correct image source variable
- [ ] Add fallback URL
- [ ] Set proper image size
- [ ] Add loading="lazy" for grids
- [ ] Test with different user avatars
- [ ] Test with different pin images
- [ ] Check console for 404 errors
- [ ] Verify placeholder color shows

---

## Status: ✅ ALL SYNCED

**Last Updated:** 2024
**Avatars:** Synced to Supabase user_metadata
**Pin Images:** Synced to Supabase Storage
**Colors:** Synced to Supabase database
**All Pages:** Using real data ✅
**All Components:** Using real data ✅
**Fallbacks:** All working ✅
**Errors:** None ✅
