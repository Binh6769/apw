# Authentication System

## Overview
Authentication sử dụng Supabase Auth với email/password.

## Features
- ✅ User registration (email/password)
- ✅ User login
- ✅ Session management (auto-persist)
- ✅ Password validation (8+ chars)
- ✅ Email validation
- ✅ User metadata storage (first/last name)
- ✅ Protected routes
- ✅ Logout functionality

## Architecture

```
┌─────────────────┐
│   Login Page    │
│   SignUp Page   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   AuthContext + useAuth()   │
│  (login, signup, logout)    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Supabase JS Client        │
│  (supabase.auth)            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Supabase Cloud (REST API)  │
│  - Authentication           │
│  - Session Management       │
└─────────────────────────────┘
```

## Setup

### 1. Environment Variables
Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Supabase Dashboard
1. Create account at https://supabase.com
2. Create new project
3. Go to Settings → API → Copy URL and anon key

## Usage

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, login, signup, logout, isAuthenticated } = useAuth();

// Login
await login(email, password);

// Signup
await signup(email, password, { firstName, lastName });

// Logout
await logout();
```

## Error Handling
- Invalid credentials detection
- Email format validation
- Password mismatch detection
- User-friendly error messages
- Loading states during auth

## Related Files
- `src/contexts/AuthContext.tsx` - Auth context & provider
- `src/pages/Login.tsx` - Login page
- `src/pages/SignUp.tsx` - Signup page
- `src/services/supabase.ts` - Supabase client

## Next Steps (Optional)
- Social auth (Google, GitHub, Facebook)
- Email verification
- Password reset
- Two-factor authentication
