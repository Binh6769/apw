# Project Overview - Pinterest Clone (APW)

## Description
A Pinterest-like web application for discovering, saving, and sharing visual content. Built as a portfolio/learning project demonstrating modern React development with Supabase backend.

## Goals
- ✅ Pinterest-style image browsing experience
- ✅ User authentication and profiles
- ✅ Pin creation, saving, and organization
- ✅ Responsive masonry grid layout
- ✅ Real-time data with Supabase

## Target Users
- Users who want to discover and save visual inspiration
- Developers learning React + Supabase stack

## Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| Authentication | Email/password login & signup | ✅ Done |
| Home Feed | Masonry grid with infinite scroll | ✅ Done |
| Pin Detail | View pin with comments | ✅ Done |
| Create Pin | Upload or link images | ✅ Done |
| Save Pins | Bookmark pins to collections | ✅ Done |
| User Profile | Avatar, bio, settings | ✅ Done |
| Photo Albums | Organize saved pins | ✅ Done |
| Image History | Track viewed images | ✅ Done |
| Comments | Comment on pins | ✅ Done |
| Search | Search pins (basic) | ⚠️ Basic |

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router 7 for navigation
- Lucide React for icons

### Backend
- Supabase Authentication
- Supabase PostgreSQL Database
- Supabase Storage for images
- Row Level Security (RLS)

### State Management
- React Context API
- TanStack Query (React Query)
- Custom hooks

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Performance | < 3s initial load |
| Responsive | Mobile-first design |
| Accessibility | Basic ARIA support |
| Browser Support | Modern browsers (Chrome, Firefox, Safari, Edge) |

## Out of Scope (v1)
- Social features (follow, like)
- Advanced search/filters
- Pinterest API integration
- Mobile app (React Native)
- Real-time notifications

## Success Metrics
- App runs without errors
- All CRUD operations work
- Responsive on mobile/desktop
- Clean, maintainable code
