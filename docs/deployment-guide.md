# Deployment Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

## Local Development

### 1. Clone & Install
```bash
git clone <repo-url>
cd apw
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-key  # Optional
```

### 3. Supabase Setup

#### Create Project
1. Go to https://supabase.com
2. Create new project
3. Copy URL and anon key from Settings → API

#### Database Tables
Run these SQL commands in Supabase SQL Editor:

```sql
-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  website TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles readable" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### Storage Buckets
1. Go to Storage in Supabase Dashboard
2. Create bucket `avatars` (public)
3. Create bucket `pins` (public)

### 4. Run Development Server
```bash
npm run dev
```
Open http://localhost:5173

## Production Build

```bash
npm run build
npm run preview  # Test production build locally
```

## Deployment Options

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Environment Variables (Production)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `VITE_UNSPLASH_ACCESS_KEY` | Unsplash API key | Optional |

## Troubleshooting

**Build fails with TypeScript errors?**
```bash
npm run lint  # Check for errors
npx tsc --noEmit  # Type check only
```

**Supabase connection issues?**
- Check env variables are set correctly
- Verify RLS policies allow access
- Check Supabase project is not paused
