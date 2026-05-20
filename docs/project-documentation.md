# HP9 - Anime Image Gallery Web Application

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Pages](#pages)
4. [Database Schema](#database-schema)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Image Sources](#image-sources)
7. [Tech Stack](#tech-stack)
8. [Setup](#setup)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**HP9** is an anime image gallery web application built with React and Supabase. Users can browse, upload, save, and organize anime-themed images.

- **Project URL**: https://hp9.vercel.app
- **Supabase Project**: nndzprkjdzwnxgwbrswl
- **Tech**: React 19, TypeScript, Vite, Supabase, TailwindCSS

---

## Features

### Core Features

| Feature | Description |
|--------|-------------|
| **User Authentication** | Email/password login and signup with Supabase Auth |
| **Image Gallery** | Pinterest-style masonry grid layout |
| **Upload Images** | Upload anime images to Supabase Storage |
| **Save Images** | Save images to personal collection |
| **Photo Albums** | Organize saved images into albums |
| **User Profile** | Edit profile with avatar, bio, location |
| **Admin Dashboard** | Manage users and content (admin only) |
| **Comments** | Comment on images |
| **Reactions** | Like/love images |

### Admin Features

| Feature | Description |
|--------|-------------|
| **Upgrade to Admin** | Grant admin role to users |
| **User Management** | View, search, ban, delete users |
| **Post Management** | View and delete all posts |
| **Ban Users** | Temporary or permanent ban |

---

## Pages

### 1. Home (`/`)
- Displays all user-uploaded images in masonry grid
- Topic selection (anime, shonen, romance, etc.)
- Infinite scroll pagination
- Sidebar filters

### 2. Login (`/login`)
- Email/password authentication
- Social login buttons (Facebook, Google)
- Forgot password link

### 3. Sign Up (`/signup`)
- Create new account
- First name, last name, email, age, password
- Terms acceptance

### 4. Pin Detail (`/pin/:id`)
- Full-size image view
- Save/unsave button
- Comments section
- Like/love reactions

### 5. Create Pin (`/create-pin`)
- Upload new image
- Add title, description, category
- AI auto-tagging

### 6. Saved (`/saved`)
- All saved images
- Grid layout

### 7. Profile (`/profile`)
- User information
- User's uploaded images
- Edit profile settings

### 8. Settings (`/settings`)
- Profile settings
- Appearance (theme, color mode)
- Grid layout options
- **Admin tab** (if admin):
  - User Management
  - Posts Management

### 9. Albums (`/albums`)
- Photo albums
- Create, edit, delete albums

### 10. History (`/history`)
- Recently viewed images
- Image sync history

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `pins` | User-uploaded images |
| `saved_pins` | User's saved images |
| `user_profiles` | User profile data |
| `likes` | Like reactions |
| `love` | Love reactions |
| `comments` | Comments on pins |
| `photo_albums` | User albums |
| `album_photos` | Album-photo relationships |

### Columns in `pins`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `user_id` | UUID | Owner user ID |
| `title` | text | Image title |
| `description` | text | Image description |
| `image_url` | text | Supabase Storage URL |
| `image_width` | int4 | Image width |
| `image_height` | int4 | Image height |
| `image_color` | text | Dominant color |
| `category` | text | Tags/categories |
| `created_at` | timestamptz | Creation date |

### Columns in `user_profiles`

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | User ID |
| `first_name` | text | First name |
| `last_name` | text | Last name |
| `avatar_url` | text | Profile avatar |
| `bio` | text | Bio |
| `location` | text | Location |
| `website` | text | Website |
| `birth_date` | date | Birth date |
| `age` | int4 | Age |
| `role` | text | user/admin/banned |
| `banned_until` | timestamptz | Ban expiration |

---

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| `user` | Upload, save, comment, create albums |
| `admin` | All user permissions + user management, post deletion |
| `banned` | No access (temporary or permanent) |

### How to Become Admin

1. Go to **Settings** page
2. Enter admin access key: `123456789`
3. Click "Upgrade to Admin"
4. New admin tabs will appear

---

## Image Sources

### Current Implementation
- **Only user uploads** - Images uploaded via Create Pin page
- External APIs removed (Waifu.im, Reddit, Safebooru, etc.)

### Image ID Format

| Type | ID Format | Example |
|------|----------|---------|
| User Upload | UUID | `a1b2c3d4-e5f6-4789-ab12-345678901234` |
| External | Prefixed | `art-xxx`, `reddit-xxx`, `mal-xxx` |

### Deleting External Images

Run in Supabase SQL Editor:

```sql
-- First, check what ID formats exist
SELECT id, LEFT(id::text, 20) as id_sample
FROM pins 
ORDER BY created_at DESC 
LIMIT 20;

-- Delete external pins (keep only UUID format)
DELETE FROM public.pins 
WHERE id::text NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

-- Alternative: delete by checking if it looks like UUID (contains dashes at right positions)
-- Keep only IDs that match UUID pattern
DELETE FROM public.pins 
WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Delete related data first
DELETE FROM public.likes WHERE pin_id IN (SELECT id FROM public.pins WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
DELETE FROM public.loves WHERE pin_id IN (SELECT id FROM public.pins WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
DELETE FROM public.comments WHERE pin_id IN (SELECT id FROM public.pins WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

-- Verify remaining
SELECT COUNT(*) as user_images_remaining FROM public.pins 
WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7 |
| Styling | TailwindCSS 3.4 |
| State | React Context, TanStack Query |
| Routing | React Router 7 |
| Backend | Supabase |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| Icons | Lucide React |

---

## Setup

### Prerequisites
- Node.js 18+
- npm
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://nndzprkjdzwnxgwbrswl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YN56SVGCaWkyH8edqQIhEA_vSB9y0Qb
VITE_ADMIN_ACCESS_KEY=123456789
```

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
```

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Vercel

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_ADMIN_ACCESS_KEY` | 123456789 |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|------|----------|
| Login fails | Check Supabase connection |
| Images not loading | Check Supabase Storage bucket |
| Admin upgrade fails | Run migration in SQL Editor |
| 404 errors | Check table names in code |

### Database Migrations

Create tables in Supabase SQL Editor:

```sql
-- Allow uploads to pins table
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pins', 'pins', true);

-- Create RLS policies
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'pins');

CREATE POLICY "User Upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'pins' AND auth.uid() = owner);
```

---

## Project Structure

```
src/
├── api/              # API clients
├── components/       # Reusable UI components
│   ├── PinCard.tsx
│   ├── MasonryGrid.tsx
│   ├── Header.tsx
│   ├── MobileNav.tsx
│   └── ...
├── contexts/        # React Context providers
│   ├── AuthContext.tsx
│   ├── UserContext.tsx
│   ├── SavedPinsContext.tsx
│   └── ...
├── hooks/           # Custom React hooks
├── pages/           # Route pages
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── SignUp.tsx
│   ├── PinDetail.tsx
│   ├── CreatePin.tsx
│   ├── Profile.tsx
│   ├── Saved.tsx
│   └── Settings.tsx
├── services/        # Backend service layer
│   ├── supabase.ts
│   ├── pinsService.ts
│   ├── adminService.ts
│   ├── userProfileService.ts
│   └── ...
├── types/          # TypeScript definitions
├── utils/          # Utility functions
└── App.tsx        # Main app component
```

---

## API Reference

### Pins Service

```typescript
// Fetch pins
fetchPinsFromSupabase(page, limit, searchQuery): Promise<Photo[]>

// Fetch single pin
fetchPinById(id): Promise<Photo | null>

// Create pin
createPin(title, imageUrl, width, height, description?, category?, color?): Promise<Pin>

// Delete pin
deletePin(pinId): Promise<boolean>

// Save pin
savePin(pinId): Promise<boolean>

// Unsave pin
unsavePin(pinId): Promise<boolean>

// Check if saved
isPinSaved(pinId): Promise<boolean>
```

### User Service

```typescript
// Get profile
getUserProfile(userId): Promise<UserProfile | null>

// Upsert profile
upsertUserProfile(userId, data): Promise<boolean>
```

### Admin Service

```typescript
// Validate admin key
validateAdminAccessKey(key): boolean

// Upgrade to admin
upgradeToAdmin(userId): Promise<boolean>

// Ban user
banUser(userId, duration): Promise<boolean>

// Unban user
unbanUser(userId): Promise<boolean>

// Delete user
deleteUserAccount(userId): Promise<boolean>

// Get all users
getAllUsersWithStats(): Promise<UserWithAuth[]>

// Get user posts
getUserPosts(userId): Promise<Photo[]>

// Delete posts
deletePosts(postIds): Promise<boolean>
```

---

## Changelog

| Version | Changes |
|---------|---------|
| 1.0.0 | Initial release |
| 1.1.0 | Added admin role system |
| 1.2.0 | Removed external APIs (user uploads only) |
| 1.3.0 | Added fallback for missing database columns |

---

## License

MIT License

---

Built with ❤️ using React + Supabase