# 🛠️ Supabase Setup Guide - Fix the "Bucket not found" Error

## ❌ What's Happening

The error **"StorageApiError: Bucket not found"** means:
- Your code is correct ✅
- Supabase bucket `profile-photos` doesn't exist yet ❌
- Need to create the storage bucket

---

## ✅ Step 1: Create the Storage Bucket

### In Supabase Dashboard:

1. **Open Supabase Console**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to Storage**
   - Left sidebar → "Storage"
   - Click "Create a new bucket"

3. **Create Bucket Configuration**
   - **Bucket name**: `profile-photos`
   - **Make it public**: ✅ Check "Public bucket"
   - Click "Create bucket"

### Expected Result:
```
✅ Bucket created: profile-photos
✅ Visibility: Public
```

---

## ✅ Step 2: Create RLS Policies

After bucket is created, you need security policies.

### Use Supabase Dashboard (Recommended) ⭐

1. **Open Storage Bucket**
   - Go to Storage → `profile-photos`
   - Click "Policies" tab

2. **Create "Upload" Policy**
   - Click "+ New policy"
   - Choose "Create a policy from templates"
   - Template: **"For authenticated users"**
   - Operation: **INSERT**
   - Click "Save policy"

3. **Create "Read" Policy**
   - Click "+ New policy"
   - Choose "Create a policy from templates"
   - Template: **"Give public read access to files"**
   - Operation: **SELECT**
   - Click "Save policy"

4. **Create "Delete" Policy**
   - Click "+ New policy"
   - Choose "Create a policy from templates"
   - Template: **"For authenticated users"**
   - Operation: **DELETE**
   - Click "Save policy"

### Expected Result:
```
✅ 3 policies created in Storage
✅ No permission errors
✅ Ready to upload!
```

---

## ✅ Alternative: Working SQL Code (For Reference)

If you're a project owner and want to use SQL instead of the Dashboard UI, here's the corrected code:

```sql
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to upload to their own folder
CREATE POLICY "Allow authenticated users to upload own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Policy 2: Allow public read access to all files
CREATE POLICY "Allow public read access to photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Policy 3: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Optional: Create simple index for better performance
CREATE INDEX IF NOT EXISTS idx_storage_bucket_id 
ON storage.objects(bucket_id) 
WHERE bucket_id = 'profile-photos';
```

**Note:** This SQL requires **project owner** permissions. For most users, the **Dashboard UI approach (Steps 1-4 above)** is simpler and doesn't require special permissions.

## ✅ Step 3: Create Avatar Bucket (Optional but Recommended)

The avatar selector also needs a bucket. Repeat steps above with:

- **Bucket name**: `avatars`
- **Make it public**: ✅ Check "Public bucket"

---

## 🧪 Step 4: Test the Upload

1. **Ensure dev server is running**
   ```bash
   npm run dev
   ```

2. **Navigate to Settings**
   - Open http://localhost:5176/settings
   - Click "Upload Photo" button

3. **Select an Image**
   - Choose a JPG, PNG, GIF, or WebP file
   - Watch the progress (0-100%)

4. **Verify Success**
   - Photo appears in profile
   - No error messages shown
   - Console shows no errors

---

## 🔍 How to Verify Bucket Was Created

### In Supabase Storage:
- Left sidebar → "Storage"
- You should see your buckets listed:
  ```
  ✅ profile-photos (Public)
  ✅ avatars (Public)
  ```

### In SQL Editor (check policies):
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

---

## 🚨 Troubleshooting

### Still getting "Bucket not found"?

**Check #1: Bucket exists**
```
Storage > Look for "profile-photos" bucket
Should be listed with Public visibility
```

**Check #2: Bucket name exact match**
```
Code uses: 'profile-photos'
Bucket name: 'profile-photos'
Must be EXACTLY the same (case-sensitive)
```

**Check #3: RLS policies enabled**
```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE schemaname = 'storage';
```

**Check #4: User is authenticated**
```
Must be logged in to upload
Avatar shows in header = logged in
```

---

## 📊 File Structure in Storage

After successful upload, your files will be stored as:

```
profile-photos/
├── {user-id}/
│   ├── {user-id}-1768393846554.jpg
│   ├── {user-id}-1768393847123.jpg
│   └── ...
└── {another-user-id}/
    └── ...
```

---

## ✅ Complete Verification Checklist

- [ ] Created `profile-photos` bucket
- [ ] Set bucket to Public
- [ ] Created `avatars` bucket (optional)
- [ ] Set avatars bucket to Public (optional)
- [ ] Executed SQL RLS policies
- [ ] Verified policies in SQL Editor
- [ ] User is authenticated (can see profile)
- [ ] Tried uploading from Settings page
- [ ] Photo appears in profile
- [ ] No "Bucket not found" errors

---

## 🎯 Quick Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Create `profile-photos` bucket | ⏳ Do this |
| 2 | Make bucket public | ⏳ Do this |
| 3 | Run RLS policy SQL | ⏳ Do this |
| 4 | Create `avatars` bucket | ⏳ Optional |
| 5 | Test upload | ⏳ After step 3 |

---

## 💡 After Setup

Once buckets are created and RLS policies are active:

✅ Photo uploads will work  
✅ Avatar selector will work  
✅ Files stored in Supabase Storage  
✅ URLs auto-generated  
✅ Database synced automatically  

---

## 🔗 Useful Links

- Supabase Console: https://app.supabase.com
- Storage Documentation: https://supabase.com/docs/guides/storage
- RLS Policies: https://supabase.com/docs/guides/storage/security/access-control

---

**Status**: Ready for Supabase setup  
**Time needed**: ~5 minutes  
**Difficulty**: Easy ✅
