# Codebase Summary

## Overview
Pinterest Clone web application built with React 19, TypeScript, and Supabase.

## Directory Structure

| Directory | Purpose | Files |
|-----------|---------|-------|
| `src/api/` | External API clients | unsplash.ts |
| `src/components/` | Reusable UI components | 10 files |
| `src/contexts/` | React Context providers | 8 files |
| `src/data/` | Static/mock data | mockData.ts |
| `src/hooks/` | Custom React hooks | 13 files |
| `src/pages/` | Route page components | 10 files |
| `src/services/` | Backend service layer | 10 files |
| `src/types/` | TypeScript definitions | 2 files |

## Key Components

### UI Components
- **Header.tsx** - Navigation header with search
- **MasonryGrid.tsx** - Pinterest-style grid layout
- **PinCard.tsx** - Individual pin card display
- **AvatarSelector.tsx** - Avatar selection modal
- **Toast.tsx** - Notification toasts
- **ErrorBoundary.tsx** - Error handling wrapper

### Pages
- **Home.tsx** - Main feed with masonry grid
- **PinDetail.tsx** - Single pin view with comments
- **CreatePin.tsx** - Create new pin form
- **Profile.tsx** - User profile page
- **Saved.tsx** - Saved pins collection
- **Login.tsx / SignUp.tsx** - Authentication pages

### Contexts
- **AuthContext** - Authentication state
- **UserContext** - User profile data
- **SavedPinsContext** - Saved pins state
- **CreatedPinsContext** - User's created pins
- **ImageHistoryContext** - Image navigation history
- **ToastContext** - Toast notifications

### Services
- **supabase.ts** - Supabase client initialization
- **pinsService.ts** - Pin CRUD operations
- **userProfileService.ts** - User profile management
- **commentsService.ts** - Comments CRUD
- **photoAlbumService.ts** - Album management
- **imageConsistencyService.ts** - Image sync logic

## Code Patterns

### State Management
- React Context for global state
- TanStack Query for server state (implied)
- Custom hooks for reusable logic

### Data Flow
```
Component → Hook → Service → Supabase → Response → State Update
```

### Error Handling
- ErrorBoundary for component errors
- Toast notifications for user feedback
- Try-catch in async operations

## File Naming Conventions
- Components: PascalCase (`PinCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAvatar.ts`)
- Services: camelCase with `Service` suffix (`pinsService.ts`)
- Types: camelCase (`index.ts`, `imageMetadata.ts`)

## Dependencies

### Production
- react, react-dom (v19)
- react-router-dom (v7)
- @supabase/supabase-js
- @tanstack/react-query
- tailwind-merge, clsx
- lucide-react
- axios

### Development
- vite, vitest
- typescript
- eslint, tailwindcss
- @testing-library/react
