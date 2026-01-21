# Supabase Authentication Setup Guide

This project now uses Supabase for authentication. Follow these steps to set up:

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Create a new project
4. Save your project credentials (URL and Anon Key)

## 2. Configure Environment Variables

Create/update the `.env.local` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project settings:
- Project URL: Settings → API → Project URL
- Anon Key: Settings → API → Project API Keys → anon

## 3. Set Up Email Confirmation (Optional)

In Supabase Dashboard:
1. Go to Authentication → Providers → Email
2. Enable "Confirm email" if desired
3. Customize email templates as needed

## 4. Install Dependencies

Make sure Supabase client is installed:

```bash
npm install @supabase/supabase-js
```

## 5. Features Implemented

- ✅ User sign up with email and password
- ✅ User sign in with email and password
- ✅ Automatic login after signup
- ✅ Password validation (minimum 8 characters)
- ✅ Email validation
- ✅ User profile data storage (first name, last name)
- ✅ Session persistence
- ✅ Logout functionality

## 6. Authentication Flow

### Sign Up
1. User enters email, password, name, and age
2. Form is validated client-side
3. User is created in Supabase Auth
4. User data is automatically logged in
5. User is redirected to home page

### Sign In
1. User enters email and password
2. Credentials are sent to Supabase
3. Session is created
4. User is redirected to home page

### Sign Out
1. Session is cleared from Supabase
2. User is redirected to login page

## 7. Using Authentication in Components

```typescript
import { useAuth } from '../contexts/AuthContext';

export function MyComponent() {
  const { isAuthenticated, user, login, signup, logout } = useAuth();
  
  // Use authentication functions
  // user object contains: id, email, user_metadata (firstName, lastName)
}
```

## 8. Protected Routes

All routes except `/login` and `/signup` are protected. Users must be authenticated to access them.

## 9. Future Enhancements

- [ ] Social authentication (Google, GitHub, Facebook, etc.)
- [ ] Magic link authentication
- [ ] Two-factor authentication
- [ ] Password reset functionality
- [ ] Email verification flow
- [ ] User profile management
- [ ] Custom claims and roles
