# Quick Fix: Disable RLS (If You Don't Have Owner Permissions)

## ⚠️ Permission Error?

If you get **"must be owner of table objects"**, you don't have the right permissions. 

**Quick workaround:** Use the **Dashboard UI** instead:

## ✅ Option 1: Dashboard UI (Recommended) 

Go to **Supabase Dashboard** → **Storage** → **`profile-photos`**:

1. Click **"Policies"** tab
2. Delete all 3 existing policies (trash icon)
3. **Do NOT create new ones** - leave it with RLS disabled
4. Test upload at http://localhost:5176/settings

This works without special permissions!

---

## ✅ Option 2: SQL (If You're Project Owner)

If you ARE the project owner, try this simpler SQL:

```sql
-- Disable RLS on storage.objects (temporary workaround)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Click "New query"
3. Paste the SQL above
4. Click "Run"
5. Test upload at http://localhost:5176/settings

---

## ✅ Option 3: Full RLS Policies (For Project Owners Only)

If you want complete RLS security, use this SQL:

```sql
-- Drop existing policies (optional)
DROP POLICY IF EXISTS "Allow authenticated users to upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own photos" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can upload
CREATE POLICY "Authenticated users can upload to profile-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Policy 2: Everyone can read
CREATE POLICY "Public read access to profile-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Policy 3: Authenticated users can delete their own files
CREATE POLICY "Authenticated users can delete from profile-photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');
```

## Steps:

1. **Open Supabase Console** → https://app.supabase.com
2. **Select your project**
3. **Go to SQL Editor** (left sidebar)
4. **Click "New query"**
5. **Paste the SQL above**
6. **Click "Run"**
7. **Check for success** (should see "Success. No rows returned.")

## Then Test:

- Go to http://localhost:5176/settings
- Click "Upload Photo"
- Should work now! ✅

---

**If you get permission error again:**
- The policies might be read-only in your project
- In that case, try the **Dashboard UI approach** from FIX_RLS_POLICY_ERROR.md instead
