# Product Reference Guide

This document summarizes the product shipped in this repo: an anime-forward Pinterest-style web app built with React + TypeScript + Vite, Supabase for auth/data/storage, and external image APIs (Jikan, Waifu.im, Unsplash, Pexels, Pixabay). It covers what the product does, how the code is structured, the main data models, and the key functions/services.

## What the product does
- Personalized feed of anime/art pins with infinite scroll, topic selection, and search.
- Supabase-authenticated experience with saved accounts, profile details, avatars, and session switching.
- Pin lifecycle: create pins, view details, save/unsave, delete own pins, comment, and add pins to albums.
- Rich media handling: profile photo upload/compression, image metadata cataloging, image view history, and album organization.
- Static pages for terms/privacy/help and responsive navigation (mobile nav + header).

## Tech stack & env
- React + TypeScript + Vite; routing via `react-router-dom`; data fetching via `@tanstack/react-query`.
- Styling via Tailwind utility classes (see `src/index.css`).
- Supabase client in `src/services/supabase.ts`; requires env vars:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (present in `.env.local`).
  - Optional: `VITE_UNSPLASH_ACCESS_KEY`, `VITE_PEXELS_API_KEY`, `VITE_PIXABAY_API_KEY` to enrich feeds.
- Build/serve: `npm install`, `npm run dev`, `npm run build`.

## App composition
- Entry (`src/main.tsx`): wraps `<App />` with `StrictMode` + `ErrorBoundary`.
- App shell (`src/App.tsx`): `QueryClientProvider` + context providers (UI settings, auth, toast, user, saved pins, created pins, image history, photo albums) and router.
- Routing: `/login`, `/signup`, `/` (Home), `/profile`, `/saved`, `/history`, `/albums`, `/album/:albumId`, `/create-pin`, `/settings`, `/terms`, `/privacy`, `/help`, `/pin/:id` (modal-friendly via background state). `RequireAuth` guards private routes.
- Global UI: `Header`, `MobileNav`, `Toast`.

## Core features by screen
- Home (`src/pages/Home.tsx`): topic chooser (defaults to user metadata), search via query param, infinite scroll feed from `fetchPhotos`, retry handling, “more like this” uses related photos.
- Pin detail (`src/pages/PinDetail.tsx`): modal or full page, save/unsave, share/download/report, delete if owner, comments, add to/remove from album, related pins grid, image view recording, album creation inline.
- Profile (`src/pages/Profile.tsx`): shows created pins, profile card, navigation to settings (uses `CreatedPinsContext`).
- Saved (`src/pages/Saved.tsx`): saved pins minus user-owned pins (`SavedPinsContext`).
- Create Pin (`src/pages/CreatePin.tsx`): upload/create flow to Supabase pins.
- Settings (`src/pages/Settings.tsx`): profile fields, avatar/photo upload, account management.
- History (`src/components/ImageHistoryPage.tsx`): paginated image views, search, delete/clear, recently viewed strip.
- Albums (`src/components/PhotoAlbumsPage.tsx`, `/album/:albumId`): create/update albums, view album photos, remove items.
- Auth (`Login`, `SignUp`): Supabase auth with saved-account switching and metadata defaults (preferred topic, isNewUser).
- Static pages (`TermsPage`, `PrivacyPage`, `HelpPage`).

## Data model (Supabase)
- `pins`: id, user_id, title/description, image_url/width/height/color, source_url, category, timestamps.
- `user_profiles`: user_id, first_name/last_name, avatar_url, bio, phone, location, website, birth_date, age, updated_at.
- `saved_pins`: user_id, pin_id, saved_at.
- `comments`: pin_id, user_id, content, timestamps (joined with `user_profiles` for name/avatar).
- `image_history`: user_id, image_id/url/title/dimensions/color/description, source, viewed_at.
- `photo_albums`: user_id, name, description, cover_image_url, is_public, timestamps.
- `album_photos`: album_id, photo_id/url/title/dimensions/color, added_at.
- `image_labels` + `image_metadata` (label_id, source, dimensions, file_size, format, color, alt, user_id, pin_id, external_id, archived flags/notes).
- Storage buckets: `profile-photos` (per-user folder; old photos cleaned on upload). Other buckets mentioned in code: `pin-images`, `avatars`.

## Important services & functions
- `api/unsplash.ts`
  - `fetchPhotos(page, query)`: merges Supabase pins with Jikan top/search, Waifu.im art, Unsplash/Pexels/Pixabay (keys optional), falls back to mock data.
  - `fetchPhotoById`, `fetchRelatedPhotos`: detail fetch + related suggestions (aspect-ratio prioritized).
- `services/supabase.ts`: Supabase client from env vars (warns if missing).
- `services/pinsService.ts`: CRUD + conversion between Supabase pins and `Photo`.
  - `fetchPinsFromSupabase`, `fetchUserPins`, `fetchSavedPins`, `createPin`, `ensurePinExists`, `deletePin`, `savePin`, `unsavePin`, `isPinSaved`, `fetchPinById`.
- `services/userProfileService.ts`: `getUserProfile`, `upsertUserProfile`, `updateUserProfile`.
- `services/photoUploadService.ts`: profile photo upload (type/size checks, per-user folder, delete old), `deleteProfilePhoto`, `listProfilePhotos`, `compressImage`.
- `services/photoAlbumService.ts`: albums CRUD + membership.
  - `createAlbum`, `fetchUserAlbums`, `fetchAlbumWithPhotos`, `addPhotoToAlbum`, `removePhotoFromAlbum`, `updateAlbum`, `deleteAlbum`, `getAlbumPhotoCount`, `searchAlbums`.
- `services/commentsService.ts`: `fetchComments` (joins profile), `addComment`, `deleteComment`.
- `services/imageHistoryService.ts`: `recordImageView`, `fetchImageHistory`, `getImageHistoryCount`, `deleteImageFromHistory`, `clearImageHistory`, `searchImageHistory`, `getRecentlyViewed`.
- `services/imageMetadataService.ts`: label creation, metadata insert/query by label/category/source/user, archive/restore helpers, stats (`getImageStats`).
- Additional utilities: `imageConsistencyService.ts`, `storageService.ts`, `photoUploadService.ts` support storage consistency and metadata (see files for field-level details).

## State & context layers
- `AuthContext`: Supabase session management, saved-account switcher (localStorage), login/signup, logout, profile metadata caching for avatars/names.
- `ToastContext`: transient toasts via `Toast` component.
- `UserContext`: local editable profile fallback (name/username/bio/avatar/website).
- `SavedPinsContext`: loads saved pins (filters out self-authored pins), optimistic save/unsave backed by Supabase, duplicate detection by id/url.
- `CreatedPinsContext`: tracks pins authored by the user (used in Profile/Create flows).
- `ImageHistoryContext`: orchestrates recording, pagination, search, deletion, count refresh, recent list.
- `PhotoAlbumContext`: album list, creation, deletion, searching, counts (hooked by `usePhotoAlbums`).
- `UISettingsContext`: theme/UI toggles; `useUiSettings` hook consumer.
- Hooks mirror contexts (`useSavedPins`, `useCreatedPins`, `useImageHistory`, `usePhotoAlbums`, `useUser`, `useToast`, `useAvatar`, `usePhotoUpload`, `useImageSync`, `useMediaColumns`, `useMasonry`, etc.) to provide typed accessors and layout helpers.

## Key interaction flows
- Feed: `Home` calls `fetchPhotos` via `useInfiniteQuery` → dedupes photos → `MasonryGrid` renders responsive columns (`useMasonry` + `useMediaColumns`).
- Pin detail: pulls cached state from router or fetches Supabase pin/remote photo → records view (`recordImageView`) → handles save/unsave (`SavedPinsContext`), comments (`useComments` + `commentsService`), album membership (`photoAlbumService`), delete pin (`deletePin`) with owner check, related photos via API.
- Save pin: `ensurePinExists` guarantees a Supabase row (even for external pins) before `savePin` inserts into `saved_pins`; optimistic UI with rollback on failure.
- Create pin: authenticated user inserts into `pins` with image metadata; created pins excluded from saved list.
- Albums: user creates albums, adds/removes photos, album cover auto-updates on add; album detail fetches `photo_albums` + `album_photos`.
- History: `recordImageView` upserts per user/image, `ImageHistoryPage` fetches/paginates/deletes/clears with counts.
- Profile photo upload: validates/optionally compresses, removes prior files in bucket, stores per-user path, exposes public URL.

## Running/testing notes
- Dev server: `npm run dev` (Vite). Build: `npm run build`.
- Tests: `src/components/Header.test.tsx` present; expand with Vitest/JSDOM if needed.
- API rate limits: Jikan/Waifu.im and optional Unsplash/Pexels/Pixabay calls include simple delay/merging logic; mock data fills gaps when APIs fail.

## Assets & supporting files
- `src/data/mockData.ts`: deterministic mock photos for offline/testing.
- `public/` holds static assets; `index.html` bootstraps app.
- Numerous implementation guides in repo root (AVATAR_*, IMAGE_*, PHOTO_UPLOAD_*, etc.) document backend setup, migrations, and deployment steps.
