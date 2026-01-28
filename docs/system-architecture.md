# System Architecture

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | TailwindCSS |
| **State** | React Context, TanStack Query |
| **Routing** | React Router 7 |
| **Backend** | Supabase (Auth, Database, Storage) |
| **Icons** | Lucide React |
| **External APIs** | Unsplash, DiceBear, UI Avatars |

## Project Structure

```
src/
├── api/              # External API integrations
│   └── unsplash.ts   # Unsplash API client
├── components/       # Reusable UI components
│   ├── AvatarSelector.tsx
│   ├── ErrorBoundary.tsx
│   ├── Header.tsx
│   ├── MasonryGrid.tsx
│   ├── MobileNav.tsx
│   ├── PinCard.tsx
│   └── Toast.tsx
├── contexts/         # React Contexts
│   ├── AuthContext.tsx
│   ├── CreatedPinsContext.tsx
│   ├── ImageHistoryContext.tsx
│   ├── PhotoAlbumContext.tsx
│   ├── SavedPinsContext.tsx
│   ├── ToastContext.tsx
│   ├── UISettingsContext.tsx
│   └── UserContext.tsx
├── data/             # Static/mock data
│   └── mockData.ts
├── hooks/            # Custom React hooks
│   ├── useAvatar.ts
│   ├── useComments.ts
│   ├── useCreatedPins.ts
│   ├── useImageHistory.ts
│   ├── useImageSync.ts
│   ├── useMasonry.ts
│   ├── useMediaColumns.ts
│   ├── usePhotoAlbums.ts
│   ├── usePhotoUpload.ts
│   ├── useSavedPins.ts
│   ├── useToast.ts
│   ├── useUiSettings.ts
│   └── useUser.ts
├── pages/            # Route pages
│   ├── AlbumDetail.tsx
│   ├── CreatePin.tsx
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── PinDetail.tsx
│   ├── Profile.tsx
│   ├── Saved.tsx
│   ├── Settings.tsx
│   ├── SignUp.tsx
│   └── StaticPages.tsx
├── services/         # Backend services
│   ├── commentsService.ts
│   ├── imageConsistencyService.ts
│   ├── imageHistoryService.ts
│   ├── imageMetadataService.ts
│   ├── photoAlbumService.ts
│   ├── photoUploadService.ts
│   ├── pinsService.ts
│   ├── storageService.ts
│   ├── supabase.ts
│   └── userProfileService.ts
├── types/            # TypeScript types
│   ├── imageMetadata.ts
│   └── index.ts
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Data Flow

```
User Action → React Component → Custom Hook → Service → Supabase
                    ↑                              ↓
                    └──────── State Update ←───────┘
```

## Core Features

| Feature | Status | Key Components |
|---------|--------|----------------|
| Authentication | ✅ | AuthContext, Login, SignUp |
| Home Feed | ✅ | MasonryGrid, Home, PinCard |
| Pin Management | ✅ | CreatePin, PinDetail, pinsService |
| User Profile | ✅ | Profile, Settings, AvatarSelector |
| Collections | ✅ | Saved, PhotoAlbumsPage, AlbumDetail |
| Image History | ✅ | ImageHistoryPage, imageConsistencyService |
| Comments | ✅ | commentsService, useComments |

## Supabase Integration

### Database Tables
- `user_profiles` - User profile data
- `pins` - Created pins
- `saved_pins` - Saved/bookmarked pins
- `photo_albums` - Album collections
- `comments` - Pin comments
- `image_metadata` - Image tracking
- `image_sync_tracking` - Navigation sync

### Storage Buckets
- `avatars` - User avatar images
- `pins` - Uploaded pin images

### RLS (Row Level Security)
All tables have RLS enabled for secure data access.
