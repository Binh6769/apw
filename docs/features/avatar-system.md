# Avatar System

## Overview
Hệ thống Avatar cho phép users chọn và upload avatar từ nhiều nguồn khác nhau.

## Features
- **DiceBear Avatars**: Generated avatars với nhiều styles
- **UI Avatars**: Text-based avatars từ tên user
- **Custom Upload**: Upload ảnh từ máy lên Supabase Storage

## Architecture

```
Profile Page → AvatarSelector Modal → 3 Tabs
                                      ├─ DiceBear (6 styles)
                                      ├─ Preset (UI Avatars, Gravatar)
                                      └─ Upload (File → Supabase Storage)
```

## Component Hierarchy

```
App
└── Profile (pages/Profile.tsx)
    ├── Avatar Display (shows current avatar)
    │   └── Camera Icon Button → onClick → setShowAvatarSelector(true)
    └── AvatarSelector (components/AvatarSelector.tsx)
        └── Modal Dialog
            ├── Tab 1: Generated (DiceBear) - 6 Avatar Options
            ├── Tab 2: Preset Sources (UI Avatars, Gravatar)
            └── Tab 3: Upload (File Input → Supabase Storage)
```

## Data Flow

### DiceBear Selection
1. User clicks camera icon → Modal opens
2. User selects DiceBear style → Generate URL with seed (userId)
3. `updateUserProfile(userId, { avatar_url })` → Supabase updates DB
4. Profile re-renders with new avatar → Modal closes

### File Upload
1. User selects file → Validate (type, size)
2. Upload to Supabase Storage → Get public URL
3. `updateUserProfile(userId, { avatar_url: publicUrl })`
4. Profile displays new uploaded image

## State Management

```typescript
// Profile Component (Parent)
userProfile: { avatar_url: string }
showAvatarSelector: boolean

// AvatarSelector Component (Child)
avatarOptions: AvatarOption[]
selectedAvatar: string
loading: boolean
uploadingFile: boolean
activeTab: 'preset' | 'dicebear' | 'upload'
```

## Database Schema

```sql
user_profiles
├── id (UUID) - Primary Key
├── user_id (UUID) - FK → auth.users
├── avatar_url (TEXT) ← Avatar URL stored here
├── first_name, last_name (TEXT)
├── bio, phone, location, website (TEXT)
└── updated_at (TIMESTAMP)
```

## Supabase Storage

```
avatars/ (bucket - PUBLIC)
└── {user-id}/
    └── {user-id}-{timestamp}.{ext}

Public URL: https://{project}.supabase.co/storage/v1/object/public/avatars/{path}
```

## RLS Policies
- Users can upload own avatars
- Public can read all avatars
- Users can delete own avatars

## Related Files
- `src/components/AvatarSelector.tsx` - Avatar selector modal
- `src/hooks/useAvatar.ts` - Avatar upload/select logic
- `src/services/userProfileService.ts` - Profile CRUD
- `src/pages/Profile.tsx` - Profile page integration
