# Supabase Integration - Quick Start

## What's Been Set Up

### 1. **Supabase Client** (`src/services/supabase.ts`)
- Initializes Supabase client with environment variables
- Provides reusable `supabase` instance for API calls

### 2. **Updated AuthContext** (`src/contexts/AuthContext.tsx`)
- Now uses Supabase Authentication
- Methods:
  - `login(email, password)` - Sign in existing users
  - `signup(email, password, firstName, lastName)` - Create new accounts
  - `logout()` - Sign out users
- State:
  - `isAuthenticated` - Boolean flag
  - `user` - Supabase user object with metadata
  - `loading` - Loading state during auth checks

### 3. **Updated Pages**
- **Login.tsx** - Integrated with `login()` method
- **SignUp.tsx** - Integrated with `signup()` method
- Both handle Supabase errors and display them to users

## Next Steps

### Step 1: Set Up Supabase Project
1. Visit https://supabase.com
2. Create a new project
3. Note your Project URL and Anon Key

### Step 2: Add Environment Variables
Create `.env.local` file with:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Install Dependencies (if not done)
```bash
npm install @supabase/supabase-js
```

### Step 4: Test Authentication
1. Start the dev server: `npm run dev`
2. Navigate to `/signup` to create an account
3. Navigate to `/login` to sign in
4. Check Supabase Dashboard → Authentication → Users to see created accounts

## File Structure

```
src/
├── services/
│   └── supabase.ts          # Supabase client initialization
├── contexts/
│   └── AuthContext.tsx      # Auth logic with Supabase
├── pages/
│   ├── Login.tsx            # Sign in page
│   └── SignUp.tsx           # Sign up page
└── ...
```

## How It Works

### Authentication Flow

```
User Sign Up:
  Form Submission
    ↓
  Validation (client-side)
    ↓
  supabase.auth.signUp(email, password, metadata)
    ↓
  Automatic Login with signInWithPassword
    ↓
  Session Created & Stored
    ↓
  Redirect to Home (/
)
```

```
User Sign In:
  Form Submission
    ↓
  supabase.auth.signInWithPassword(email, password)
    ↓
  Session Created & Stored
    ↓
  Redirect to Home (/)
```

## API Reference

### useAuth Hook
```typescript
const { isAuthenticated, user, loading, login, signup, logout } = useAuth();

// Login
const { error } = await login('user@example.com', 'password');

// Signup
const { error } = await signup('user@example.com', 'password', 'John', 'Doe');

// Logout
await logout();

// User object
if (user) {
  console.log(user.email);
  console.log(user.user_metadata?.firstName);
  console.log(user.user_metadata?.lastName);
}
```

## Error Handling

All authentication methods return an error object if something goes wrong:

```typescript
const { error } = await login(email, password);
if (error) {
  // Handle error
  console.log(error); // "Invalid login credentials" or other Supabase error
}
```

## Database Schema (Optional)

If you want to store additional user data, create a `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

## Troubleshooting

### "Supabase environment variables not set"
- Make sure `.env.local` exists with correct variables
- Restart dev server after adding env variables
- Check variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### "Invalid login credentials"
- Make sure user exists in Supabase Dashboard
- Check email and password are correct

### "Password should be at least 8 characters"
- Supabase has default password requirements
- This is shown in form validation before sending

## Features Ready to Implement

- [ ] Social Login (Google, GitHub, Facebook)
- [ ] Magic Link Authentication
- [ ] Password Reset
- [ ] Email Verification
- [ ] Two-Factor Authentication
- [ ] User Profiles Management
- [ ] Avatar Upload

## Support

For more info, check:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript)
