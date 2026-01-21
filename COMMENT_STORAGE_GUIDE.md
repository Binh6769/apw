# Comment Data Storage Guide

## Overview
Comments are stored in Supabase with full CRUD operations, real-time synchronization, and Row Level Security (RLS).

## Database Schema

### Comments Table Structure
```sql
- id (UUID, Primary Key)
- pin_id (UUID, Foreign Key → pins.id)
- user_id (UUID, Foreign Key → auth.users.id)
- content (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Indexes
- `idx_comments_pin_id`: Fast lookup by pin
- `idx_comments_user_id`: Fast lookup by user
- `idx_comments_created_at`: Fast sorting by timestamp

## Setup Instructions

### Step 1: Create the Comments Table
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Open the **SQL Editor**
4. Copy the entire content from `COMMENTS_DATABASE_SETUP.sql`
5. Click **Run** to execute

This will:
- ✅ Create the `comments` table
- ✅ Add proper foreign keys
- ✅ Create indexes for performance
- ✅ Enable Row Level Security (RLS)
- ✅ Create RLS policies
- ✅ Set up auto-update timestamp trigger

## How Comments Are Stored

### Adding a Comment
```typescript
// In src/services/commentsService.ts
export const addComment = async (pinId: string, content: string): Promise<Comment | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('comments')
    .insert({
      pin_id: pinId,
      user_id: user.id,
      content,
    })
    .select()
    .single();
    
  return data; // Now stored in Supabase
};
```

**Data Flow:**
1. User submits comment text
2. `addComment()` gets authenticated user ID
3. Comment inserted into `comments` table
4. Timestamp auto-generated (created_at, updated_at)
5. Comment returned to UI for real-time display

### Fetching Comments
```typescript
export const fetchComments = async (pinId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      pin_id,
      user_id,
      content,
      created_at,
      updated_at,
      user_profiles (
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('pin_id', pinId)
    .order('created_at', { ascending: false });
    
  return data; // Comments retrieved from Supabase
};
```

**Features:**
- ✅ Joins with `user_profiles` for author info
- ✅ Sorted by newest first
- ✅ Includes user avatar and name
- ✅ Handles anonymous users (no profile data)

### Deleting Comments
```typescript
export const deleteComment = async (commentId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
    
  return !error; // Deleted from Supabase
};
```

**Security:**
- RLS ensures only comment owner can delete
- Pin cascade deletes all related comments automatically

## Row Level Security (RLS) Policies

### Read Policy
```sql
Everyone can read all comments (Public read)
```
- Anyone can view comments on any pin
- No authentication required

### Create Policy
```sql
Authenticated users can create comments
```
- Must be logged in
- `user_id` automatically set to logged-in user

### Update Policy
```sql
Users can update only their own comments
```
- Can only update if `user_id = auth.uid()`

### Delete Policy
```sql
Users can delete only their own comments
```
- Can only delete if `user_id = auth.uid()`

## Auto-Timestamp Management

The `comments_update_timestamp` trigger automatically updates `updated_at` whenever a comment is modified:

```sql
CREATE TRIGGER comments_update_timestamp
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comments_updated_at();
```

- `created_at`: Set once, never changes
- `updated_at`: Auto-updated on modification

## Performance Optimizations

### Indexes
- **pin_id**: Fast filtering by pin (most common query)
- **user_id**: Fast filtering by author
- **created_at DESC**: Fast sorting (newest first)

### Query Optimization
```typescript
// Efficient: Uses index on pin_id
.eq('pin_id', pinId)

// Efficient: Joined at database level
.select('...user_profiles(...)')

// Efficient: Index supports sorting
.order('created_at', { ascending: false })
```

## Data Relationships

```
auth.users (1) ──┐
                 ├─→ comments (N)
                 └─ (user_id)
                 
pins (1) ────→ comments (N)
               (pin_id)

user_profiles (1) ←─ comments (N)
                     (user_id join)
```

## Frontend Implementation

### Hook: useComments
Located in `src/hooks/useComments.ts`

```typescript
const { comments, loading, addComment, deleteComment } = useComments(pinId);
```

**Features:**
- ✅ Auto-loads comments on mount
- ✅ Optimistic UI updates
- ✅ Error handling
- ✅ User authentication check
- ✅ Real-time sync with Supabase

### Usage in Components
```typescript
// Fetch comments for a pin
const { comments, loading, addComment, deleteComment } = useComments(pinId);

// Add comment
await addComment(commentText);

// Delete comment
await deleteComment(commentId);

// Display
{comments.map(comment => (
  <CommentCard key={comment.id} comment={comment} />
))}
```

## Storage Verification

### Check Comments Table Exists
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'comments'
);
```

### View All Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'comments';
```

### Check Indexes
```sql
SELECT * FROM pg_indexes WHERE tablename = 'comments';
```

### View Sample Comments
```sql
SELECT 
  c.id,
  c.content,
  c.created_at,
  up.first_name,
  up.last_name
FROM comments c
LEFT JOIN user_profiles up ON c.user_id = up.user_id
ORDER BY c.created_at DESC
LIMIT 10;
```

## Troubleshooting

### Comments Not Saving?
- ✅ Check RLS policies are created
- ✅ Verify user is authenticated
- ✅ Check `pin_id` exists in `pins` table
- ✅ Review Supabase logs

### Comments Not Loading?
- ✅ Verify `comments` table exists
- ✅ Check read RLS policy
- ✅ Ensure `user_profiles` relationship works

### Performance Issues?
- ✅ Verify indexes exist
- ✅ Check indexes are being used (EXPLAIN ANALYZE)
- ✅ Consider pagination for large comment counts

## Summary

| Feature | Status | Location |
|---------|--------|----------|
| Database Table | ✅ | `COMMENTS_DATABASE_SETUP.sql` |
| RLS Policies | ✅ | Supabase (Auto-created) |
| Service Methods | ✅ | `src/services/commentsService.ts` |
| React Hook | ✅ | `src/hooks/useComments.ts` |
| UI Components | ✅ | Used in `PinDetail.tsx` |
| Real-time Sync | ✅ | Supabase PostgreSQL |
| Auto-timestamps | ✅ | Database trigger |
| Indexes | ✅ | For performance |

All comment data is now fully stored in Supabase with proper security, performance, and real-time synchronization!
