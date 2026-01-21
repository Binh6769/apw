# Avatar Selector Architecture & Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌──────────────────────────────────────────────┐          │
│    │          Profile Page (React)                 │          │
│    │  ┌───────────────────────────────────────┐   │          │
│    │  │  Avatar Display                       │   │          │
│    │  │  [👤 with Camera Icon on Hover] ─┐   │   │          │
│    │  │                                   │   │   │          │
│    │  │  Click Camera ──────────────┐     │   │   │          │
│    │  └────────────────────────────┼─────┘   │   │          │
│    │                               │         │   │          │
│    │  ┌──────────────────────────┐ │         │   │          │
│    │  │  AvatarSelector Modal    │◄┘         │   │          │
│    │  │  ┌────┬────┬──────────┐  │          │   │          │
│    │  │  │Gen │Pre │ Upload   │  │          │   │          │
│    │  │  │Tab │Tab │  Tab     │  │          │   │          │
│    │  │  └────┴────┴──────────┘  │          │   │          │
│    │  └──────────────────────────┘          │   │          │
│    └──────────────────────────────────────────┘   │          │
│                                                    │          │
└──────────────────────────────────────────────────┬┘          │
                                                    │           │
                        ┌───────────────────────────┘           │
                        │                                       │
                        ▼                                       │
        ┌───────────────────────────────────────────┐           │
        │   API Services & External Sources         │           │
        │                                           │           │
        │  DiceBear API                             │           │
        │  https://api.dicebear.com/7.x/...        │           │
        │                                           │           │
        │  UI Avatars API                          │           │
        │  https://ui-avatars.com/api/...          │           │
        │                                           │           │
        │  Browser File Upload API                 │           │
        └─────┬──────────────────────────┬──────────┘           │
              │                          │                      │
              │                    ┌─────┴────────┐             │
              │                    │ Upload File  │             │
              │                    └──────┬───────┘             │
              │                           │                     │
              ▼                           ▼                     │
        ┌──────────────────────────────────────────┐            │
        │     Supabase Cloud                        │            │
        │                                          │            │
        │  ┌────────────────┐  ┌────────────────┐  │            │
        │  │  Storage API   │  │  Database API  │  │            │
        │  │  (avatars)     │  │  (user_profile)│  │            │
        │  │                │  │                │  │            │
        │  │ POST upload    │  │ UPDATE avatar │  │            │
        │  │ GET public url │  │ _url          │  │            │
        │  └────────────────┘  └────────────────┘  │            │
        │                                          │            │
        │  RLS Policies                           │            │
        │  ├─ Users can upload own avatars        │            │
        │  ├─ Public can read all avatars         │            │
        │  └─ Users can delete own avatars        │            │
        │                                          │            │
        └──────────────────────────────────────────┘            │
                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
└── Profile (pages/Profile.tsx)
    ├── Header
    ├── Avatar Display (shows current avatar)
    │   └── Camera Icon Button
    │       └── onClick -> setShowAvatarSelector(true)
    └── AvatarSelector (components/AvatarSelector.tsx)
        └── Modal Dialog
            ├── Tab 1: Generated (DiceBear)
            │   └── 6 Avatar Options
            │       └── onClick -> selectAvatar -> updateProfile
            │
            ├── Tab 2: Preset Sources
            │   ├── UI Avatars
            │   └── Gravatar
            │       └── onClick -> selectAvatar -> updateProfile
            │
            └── Tab 3: Upload
                └── File Input
                    └── onChange -> uploadFile -> saveToStorage -> updateProfile
```

## Data Flow Diagram

### DiceBear Avatar Selection Flow

```
User clicks camera
     │
     ▼
Modal opens, DiceBear tab active
     │
     ▼
User sees 6 avatar options (generated via API)
     │
     ▼
User clicks one
     │
     ▼
AvatarSelector.selectAvatar(url)
     │
     ▼
updateUserProfile(userId, { avatar_url: url })
     │
     ▼
Supabase updates user_profiles table
     │
     ▼
Profile component state updates
     │
     ▼
Avatar re-renders with new image
     │
     ▼
Modal closes after 500ms delay
```

### File Upload Flow

```
User clicks Upload tab
     │
     ▼
User selects file
     │
     ▼
onChange trigger handleFileUpload()
     │
     ▼
Validate file (type, size)
     │
     ▼
Upload to Supabase Storage
     │
     ▼
GET public URL
     │
     ▼
updateUserProfile(userId, { avatar_url: publicUrl })
     │
     ▼
Supabase updates database
     │
     ▼
Profile component updates
     │
     ▼
Avatar displays new uploaded image
     │
     ▼
Modal closes
```

## State Management

```
Profile Component (Parent)
│
├── State: userProfile
│   └── avatar_url: string (from Supabase)
│
├── State: showAvatarSelector: boolean
│   └── Toggle modal visibility
│
└── Pass to AvatarSelector:
    ├── userId: string (for uploads)
    ├── currentAvatarUrl: string (for preview)
    ├── onAvatarChange: (url: string) => void
    │   └── Updates parent state
    └── onClose: () => void
        └── Closes modal

AvatarSelector Component (Child)
│
├── State: avatarOptions: AvatarOption[]
│   └── Generated options (DiceBear, etc)
│
├── State: selectedAvatar: string
│   └── Current selection for preview
│
├── State: loading: boolean
│   └── Save operation in progress
│
├── State: uploadingFile: boolean
│   └── File upload in progress
│
└── State: activeTab: 'preset' | 'dicebear' | 'upload'
    └── Current tab selection
```

## Timeline (Typical User Interaction)

```
Time Event
 0ms  User loads profile page
      - Avatar displays default from Supabase
      - Camera icon hidden

100ms User hovers over avatar
      - Camera icon fades in
      
200ms User clicks camera icon
      - Modal opens (500ms animation)
      
700ms Modal visible
      - DiceBear tab active by default
      - Shows 6 avatar options
      - Preset tab has 2 options
      - Upload tab has file input
      
1200ms User clicks DiceBear style
       - Selected avatar highlighted
       - Loading indicator appears
       
1300ms updateUserProfile() called
       - Supabase updates database
       
2000ms Supabase returns success
       - Profile state updates
       - Avatar re-renders
       - Loading disappears
       
2500ms Modal auto-closes
       - onClose callback fired
       - showAvatarSelector = false
       
3000ms Profile displays new avatar
```

## Module Dependencies

```
Profile.tsx
├── Imports:
│   ├── react
│   ├── AvatarSelector (NEW)
│   ├── services/userProfileService
│   ├── contexts/AuthContext
│   └── react-router-dom
│
└── Uses:
    ├── useState (modal, profile)
    ├── useEffect (load profile)
    ├── useAuth (user data)
    └── AvatarSelector component

AvatarSelector.tsx
├── Imports:
│   ├── react (hooks)
│   ├── lucide-react (Camera, Upload icons)
│   ├── services/supabase (storage)
│   └── services/userProfileService
│
└── Uses:
    ├── useState (many)
    ├── useEffect (generate options)
    └── useCallback (event handlers)

useAvatar.ts (Hook)
├── Imports:
│   ├── react (useState, useCallback)
│   ├── services/supabase
│   └── services/userProfileService
│
└── Exports:
    ├── uploadAvatar() function
    └── selectAvatarUrl() function
```

## API Call Sequence

### Selecting DiceBear Avatar

```
1. Client → Client-side only (no API call)
   - Generate DiceBear URL with seed (userId)
   - Display avatar preview

2. Client → Supabase Database
   POST /rest/v1/user_profiles
   {
     "user_id": "abc123",
     "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=abc123"
   }

3. Supabase → Client
   200 OK with updated record
   {
     "id": "xyz",
     "user_id": "abc123",
     "avatar_url": "https://api.dicebear.com/...",
     "updated_at": "2024-01-15T..."
   }

4. Client → Browser Display
   Render new avatar URL in <img> tag
```

### Uploading Custom Avatar

```
1. Client → File Selection
   User selects image from disk
   Validate: type & size

2. Client → Supabase Storage
   POST /storage/v1/object/avatars/{fileName}
   Body: File binary data
   Headers: Authorization: Bearer {token}

3. Supabase → Cloud Storage
   Scan file for malware
   Store in avatars bucket
   Generate public URL

4. Supabase → Client
   200 OK
   {
     "publicUrl": "https://...avatars/file-123.jpg"
   }

5. Client → Supabase Database
   POST /rest/v1/user_profiles
   {
     "user_id": "abc123",
     "avatar_url": "https://...avatars/file-123.jpg"
   }

6. Supabase → Client
   200 OK with updated record

7. Client → Browser Display
   Render uploaded image
```

## Supabase Storage Structure

```
Supabase Project
└── Storage
    └── avatars/ (bucket - PUBLIC)
        ├── user-id-1/
        │   ├── user-id-1-1705276800000.jpg (original)
        │   └── user-id-1-1705277000000.png (newer)
        │
        └── user-id-2/
            └── user-id-2-1705275000000.gif

Each file publicly accessible at:
https://{project-id}.supabase.co/storage/v1/object/public/avatars/user-id-1/...
```

## Database Schema

```
user_profiles table
├── id (UUID) - Primary Key
├── user_id (UUID) - Foreign Key → auth.users
├── first_name (TEXT)
├── last_name (TEXT)
├── avatar_url (TEXT) ← Avatar selector stores URL here
├── bio (TEXT)
├── phone (TEXT)
├── location (TEXT)
├── website (TEXT)
├── birth_date (DATE)
├── age (INTEGER)
└── updated_at (TIMESTAMP)
```

## Security & RLS Flow

```
User clicks upload
     │
     ▼
Browser authenticates with Supabase token
     │
     ▼
Supabase checks RLS policy
     │
     ├─ Is bucket_id = 'avatars'? ✓
     ├─ Is user authenticated? ✓
     ├─ Is folder name = auth.uid()? ✓
     │
     ▼
Upload allowed
     │
     ▼
File stored in: avatars/{user-uuid}/{filename}
     │
     ▼
Malware scan performed
     │
     ▼
Public URL generated
     │
     ▼
Return to client
```

---

This architecture ensures:
✅ Modular components
✅ Clear data flow
✅ Secure uploads
✅ Responsive UI
✅ Type safety
✅ Error handling
