# 🔧 Fix: RLS Policy Violation Error

## ❌ The Error

```
StorageApiError: new row violates row-level security policy
```

## ✅ The Solution

Your RLS policies need to be **fixed to match your file structure**.

### Edit the Policies in Supabase Dashboard

Go to: **Storage** → **`profile-photos`** → **Policies**

#### Policy 1: Upload (INSERT)

**Current Problem:** The template doesn't match your path format

**Fix: Delete the old policy and create a new one**

1. Click the **trash icon** next to the "Upload" policy
2. Click **"+ New Policy"**
3. Choose **"For authenticated users"** 
4. **Operation**: SELECT (first, we'll fix this)
5. Under **"Allowed operations"**, uncheck SELECT and check **INSERT**
6. Click **"Advanced"** and paste this condition:

```
bucket_id = 'profile-photos'
```

7. Click **"Save policy"**

---

#### Policy 2: Delete (DELETE) - Fix This Too

1. Click the **trash icon** next to the "Delete" policy
2. Click **"+ New Policy"**
3. Choose **"For authenticated users"**
4. **Operation**: DELETE
5. Click **"Advanced"** - add condition:

```
bucket_id = 'profile-photos'
```

6. Click **"Save policy"**

---

#### Policy 3: Read (SELECT) - This One is Fine ✅

Keep the **"Give public read access"** policy as-is. It should work.

---

## 🧪 Test Again

After fixing the policies:

1. Go to http://localhost:5176/settings
2. Click "Upload Photo"
3. Select an image
4. Should upload successfully! ✅

---

## 💡 Why This Happens

The Supabase dashboard templates create complex policies that might not match your exact file path structure. By using simpler conditions (`bucket_id` only), it allows authenticated users to upload to their own folders without path restrictions.

**Your file structure:**
```
profile-photos/
  └── {user-id}/
      └── {user-id}-timestamp.jpg
```

**The policy:** Allows authenticated users to write to the entire `profile-photos` bucket (Supabase handles user isolation via auth).

---

## 🚀 After Upload Works

Once photo upload works, test the avatar selector feature too:

1. Create `avatars` bucket (same as `profile-photos`)
2. Add 3 policies (INSERT, SELECT, DELETE)
3. Test avatar selector on `/profile` page
