# AP Web - Photo-Pinning Social Platform

## Overview

This is a **photo-pinning social web application** built with React, TypeScript, Supabase (backend-as-a-service), and Vite. Think of it as a Pinterest-style platform where users can create, share, save, and interact with image pins.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS |
| State Management | React Query (TanStack Query) |
| Routing | React Router DOM v7 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Build Tool | Vite 7 |
| Image Processing | Sharp |
| AI Tagging | Custom aiTagger utility |

## Database Schema

### Core Tables

```sql
-- Main pin storage
pins (
  id uuid PK,
  user_id uuid FK → auth.users,
  title text,
  description text,
  image_url text,
  image_width, image_height int,
  image_color text,
  source_url text,
  category text,
  created_at, updated_at timestamptz
)

-- User profiles (extended auth.users)
user_profiles (
  id uuid PK,
  user_id uuid FK,
  first_name, last_name, bio text,
  avatar_url text,
  created_at timestamptz
)

-- Saved pins (bookmarks)
saved_pins (
  id uuid PK,
  user_id uuid FK,
  pin_id uuid FK,
  saved_at timestamptz,
  unique(user_id, pin_id)
)

-- Reactions (likes/loves)
likes (id, user_id, pin_id, created_at)
loves (id, user_id, pin_id, created_at)

-- Comments
comments (id, user_id, pin_id, content, created_at, updated_at)

-- User preferences
ui_preferences (user_id PK, settings jsonb, updated_at)

-- Image history
image_history (id, user_id, image_id, viewed_at)
```

## Key Features

### 1. Authentication
- Supabase Auth (email/password)
- User metadata storage for preferences
- Protected routes with `RequireAuth` component

### 2. Pin Management
- **Create**: Upload images with title, description, category
- **Read**: Fetch pins with search, pagination, filtering
- **Update**: Edit pin details
- **Delete**: Remove pins (creator only)
- **Save/Unsave**: Bookmark pins for later

### 3. Social Interactions
- **Likes/Loves**: React to pins (one per user per pin)
- **Comments**: Threaded discussions on pins
- **Profile following**: Via user_profiles table

### 4. Search & Discovery
- Full-text search across title, description, category
- Topic-based filtering (anime, shonen, romance, etc.)
- Dynamic tag extraction via AI

### 5. Infinite Scroll
- Masonry grid layout for pin display
- Intersection Observer for pagination
- React Query infinite query pattern

### 6. Photo Albums
- System albums for organizing saved pins
- Custom album creation
- Album detail views

### 7. Image History
- Track viewed images per user
- Faster lookups with indexed queries

### 8. Admin System
- Role-based access control
- Admin migrations for system management

## Architecture

### Directory Structure
```
src/
├── api/           # External API integrations (Unsplash)
├── components/    # Reusable UI components
│   ├── Header.tsx
│   ├── MasonryGrid.tsx
│   ├── MobileNav.tsx
│   ├── SidebarFilter.tsx
│   └── ...
├── contexts/      # React Context providers
│   ├── AuthContext.tsx
│   ├── SavedPinsContext.tsx
│   ├── UserContext.tsx
│   ├── ToastContext.tsx
│   └── ...
├── hooks/         # Custom React hooks
│   ├── useMasonry.ts
│   ├── usePhotoAlbums.ts
│   ├── useSavedPins.ts
│   └── ...
├── pages/         # Route pages
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── SignUp.tsx
│   ├── Profile.tsx
│   ├── PinDetail.tsx
│   ├── CreatePin.tsx
│   ├── Saved.tsx
│   └── ...
├── services/     # Data layer (Supabase operations)
│   ├── pinsService.ts
│   ├── userProfileService.ts
│   ├── reactionsService.ts
│   ├── commentsService.ts
│   └── ...
├── types/         # TypeScript interfaces
├── utils/         # Utilities
│   └── aiTagger.ts   # AI-powered image tagging
├── App.tsx        # Main app with routing
└── main.tsx      # Entry point
```

### State Management Flow
```
Use React Query (TanStack Query)
    ↓
Fetch from Supabase REST API
    ↓
Cache & dedupe responses
    ↓
React Context for auth & UI state
```

### Routing Structure
| Route | Component | Access |
|-------|-----------|--------|
| `/` | Home | Auth required |
| `/login` | Login | Public |
| `/signup` | SignUp | Public |
| `/profile` | Profile | Auth required |
| `/saved` | Saved | Auth required |
| `/create-pin` | CreatePin | Auth required |
| `/pin/:id` | PinDetail | Auth required |
| `/settings` | Settings | Auth required |
| `/albums` | PhotoAlbumsPage | Auth required |
| `/album/:albumId` | AlbumDetail | Auth required |
| `/history` | ImageHistoryPage | Auth required |
| `/terms`, `/privacy`, `/help` | StaticPages | Public |

## Key Services

### pinsService.ts
- `fetchPinsFromSupabase(page, limit, searchQuery)` - Paginated pin fetching
- `fetchUserPins(userId)` - User's created pins
- `fetchSavedPins(userId)` - User's saved pins
- `createPin(...)` - Create new pin
- `savePin(pinId)` / `unsavePin(pinId)` - Bookmark management
- `fetchPinById(pinId)` - Single pin detail
- `deletePin(pinId)` - Remove pin
- `isPinSaved(pinId)` - Check saved status

### userProfileService.ts
- `fetchProfile(userId)` / `updateProfile(...)` - Profile CRUD

### reactionsService.ts
- `addLike(pinId)` / `addLove(pinId)` / `removeReaction(pinId)`
- `getReactions(pinId)` - Fetch reaction counts
- `getUserReactions(userId)` - User's reactions

### commentsService.ts
- `fetchComments(pinId)` / `addComment(pinId, content)` / `deleteComment(id)`

### photoAlbumService.ts
- `fetchUserAlbums()` / `createAlbum(...)` / `addToAlbum(...)`

## UI/UX Conventions

### Design System
- Custom anime-inspired theme via Tailwind CSS
- Dark mode primary (#0f0f23 background)
- Purple accent colors (#7c3aed primary)
- Glassmorphism effects

### Components
- Header: Logo, search, navigation
- MasonryGrid: Pinterest-style variable-height grid
- SidebarFilter: Topic/tag filtering
- MobileNav: Bottom navigation (mobile)
- PinCard: Individual pin display
- Modal: Pin detail view

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Dependencies

### Core
- react, react-dom ^19.2.4
- @supabase/supabase-js ^2.90.0
- @tanstack/react-query ^5.90.12
- react-router-dom ^7.10.1

### UI
- lucide-react (icons)
- react-icons
- clsx, tailwind-merge (class utilities)

### Dev
- vite, typescript
- tailwindcss, postcss
- eslint

## Workflows

### Creating a Pin
1. User navigates to `/create-pin`
2. Uploads image (stored in Supabase Storage)
3. Adds title, description, category
4. AI auto-generates tags via aiTagger
5. Pin saved to `pins` table

### Discovering Pins
1. User visits Home (`/`)
2. Infinite scroll loads pins in batches of 20
3. Search/filter by topic or tags
4. Click pin → PinDetail view
5. Can like, love, comment, or save

### Saving Pins
1. From PinDetail, click save icon
2. Saved to `saved_pins` table
3. Available in `/saved` page
4. Can organize into albums

## Security

- Row Level Security (RLS) policies on all tables
- Authenticated routes protected via RequireAuth
- Users can only modify their own data
- Input validation on all forms

## Performance

- React Query caching (5 min stale time)
- Infinite scroll with Intersection Observer
- Database indexes on frequently queried columns
- Optimistic UI updates for interactions