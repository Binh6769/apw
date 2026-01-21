# Image History Feature - Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         React Components                               │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │  ┌──────────────┐    ┌─────────────────┐              │   │
│  │  │ PinDetail    │    │ ImageHistoryPage│              │   │
│  │  │ (Records     │    │ (Displays       │              │   │
│  │  │  views)      │    │  history)       │              │   │
│  │  └──────┬───────┘    └────────┬────────┘              │   │
│  │         │                     │                       │   │
│  │         └──────────┬──────────┘                       │   │
│  │                    │                                  │   │
│  │            ┌───────▼────────┐                        │   │
│  │            │  useImageHistory│                        │   │
│  │            │  (Custom Hook)  │                        │   │
│  │            └───────┬────────┘                        │   │
│  │                    │                                  │   │
│  │            ┌───────▼──────────────────┐              │   │
│  │            │  ImageHistoryContext     │              │   │
│  │            │  (State Management)      │              │   │
│  │            └───────┬──────────────────┘              │   │
│  └────────────────────┼───────────────────────────────────┘   │
│                       │                                        │
└───────────────────────┼────────────────────────────────────────┘
                        │
                        │ API Calls
                        │
┌───────────────────────▼────────────────────────────────────────┐
│                   SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         imageHistoryService.ts                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │ • recordImageView()                              │          │
│  │ • fetchImageHistory()                            │          │
│  │ • getImageHistoryCount()                         │          │
│  │ • deleteImageFromHistory()                       │          │
│  │ • clearImageHistory()                            │          │
│  │ • searchImageHistory()                           │          │
│  │ • getRecentlyViewed()                            │          │
│  └──────────────────────┬───────────────────────────┘          │
│                         │                                      │
│                         │ Supabase Client                      │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          │ HTTPS/REST
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│              SUPABASE (PostgreSQL Database)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  image_history table                                            │
│  ┌──────────────────────────────────────────────────┐          │
│  │ id (UUID)                                        │          │
│  │ user_id (FK → auth.users)                        │          │
│  │ image_id (TEXT)                                  │          │
│  │ image_url (TEXT)                                 │          │
│  │ image_title (TEXT)                               │          │
│  │ image_width, image_height (INT)                  │          │
│  │ image_color (TEXT)                               │          │
│  │ image_description (TEXT)                         │          │
│  │ source (TEXT)                                    │          │
│  │ viewed_at (TIMESTAMP)                            │          │
│  │ created_at (TIMESTAMP)                           │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  Indexes:                                                       │
│  • idx_image_history_user_viewed (user_id, viewed_at DESC)    │
│  • idx_image_history_user_id (user_id)                        │
│                                                                 │
│  RLS Policies:                                                  │
│  • SELECT: Users see their own history                         │
│  • INSERT: Users create their own entries                      │
│  • UPDATE: Users update their own entries                      │
│  • DELETE: Users delete their own entries                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

### When User Views an Image

```
User Clicks Image
    │
    ├─► Browser Routes to /pin/:id
    │   └─► PinDetail Component Mounts
    │       │
    │       ├─► Photo Data Loads
    │       │   └─► useImageHistory Hook Available
    │       │
    │       └─► useEffect Triggered (photo?.id dependency)
    │           │
    │           ├─► recordView(photo, 'unsplash') Called
    │           │   │
    │           │   └─► recordImageView Service Function
    │           │       │
    │           │       ├─► Get Current User from Auth
    │           │       │
    │           │       ├─► Call supabase.from('image_history')
    │           │       │   .upsert({...})
    │           │       │   └─► Database RLS Policy Checks:
    │           │       │       ├─► Is user authenticated? ✓
    │           │       │       ├─► Does auth.uid() = user_id? ✓
    │           │       │       └─► INSERT or UPDATE record ✓
    │           │       │
    │           │       └─► Return true (success)
    │           │
    │           └─► Context Updates:
    │               ├─► historyCount++
    │               └─► UI reflects change
    │
    └─► Browser Console Logs:
        "Image view recorded successfully"
```

### When User Accesses History Page

```
User Clicks "View History" Menu
    │
    ├─► Browser Routes to /history
    │
    └─► ImageHistoryPage Component Mounts
        │
        ├─► ImageHistoryContext Loads
        │   │
        │   └─► useImageHistory Hook Activated
        │       │
        │       └─► useEffect in Context:
        │           ├─► Check if User Authenticated
        │           │
        │           ├─► loadHistory(50, 0) Called
        │           │   │
        │           │   └─► fetchImageHistory Service
        │           │       │
        │           │       └─► supabase.from('image_history')
        │           │           .select('*')
        │           │           .eq('user_id', userId)
        │           │           .order('viewed_at', {ascending: false})
        │           │           .range(0, 49)
        │           │           │
        │           │           └─► RLS Policy Validates:
        │           │               ├─► Is user authenticated? ✓
        │           │               ├─► Does auth.uid() = user_id? ✓
        │           │               └─► Return user's records only ✓
        │           │
        │           └─► Context Updates:
        │               ├─► history = [Array of 20 items]
        │               ├─► historyCount = Total count
        │               └─► loading = false
        │
        ├─► Component Renders:
        │   ├─► History List
        │   ├─► Search Bar
        │   └─► Pagination
        │
        └─► User Can:
            ├─► Search (calls searchHistory)
            ├─► Delete Items (calls deleteHistoryItem)
            ├─► Clear All (calls clearAll)
            └─► Browse Pages (calls loadHistory with offset)
```

---

## 🔄 State Management Flow

```
┌─────────────────────────────────────────────────┐
│      ImageHistoryContext (App-level)            │
├─────────────────────────────────────────────────┤
│                                                 │
│  State:                                         │
│  ├─ history: ImageHistoryRecord[]              │
│  ├─ recentlyViewed: ImageHistoryRecord[]        │
│  ├─ historyCount: number                        │
│  ├─ loading: boolean                            │
│  ├─ isRecording: boolean                        │
│  │                                              │
│  Functions:                                     │
│  ├─ recordView(photo, source)                   │
│  ├─ loadHistory(limit, offset)                  │
│  ├─ loadRecentlyViewed(limit)                   │
│  ├─ deleteHistoryItem(id)                       │
│  ├─ clearAll()                                  │
│  ├─ searchHistory(query)                        │
│  └─ refreshCount()                              │
│                                                 │
└──────────────┬──────────────────────────────────┘
               │
               │ useImageHistory Hook
               │ (Custom Hook)
               │
      ┌────────▼────────┐
      │   Components    │
      ├─────────────────┤
      │ • PinDetail     │
      │ • Header        │
      │ • HistoryPage   │
      │ • Any Component │
      └─────────────────┘
```

---

## 🔐 Security Layer

```
┌─────────────────────────────────────────────────┐
│    CLIENT-SIDE AUTHENTICATION                   │
├─────────────────────────────────────────────────┤
│ Check: useAuth() hook verifies user exists      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  SERVICE LAYER VALIDATION                       │
├─────────────────────────────────────────────────┤
│ const user = supabase.auth.getUser()            │
│ if (!user) throw new Error('Not authenticated') │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  DATABASE RLS POLICIES                          │
├─────────────────────────────────────────────────┤
│ @SELECT:                                        │
│   WHERE auth.uid() = user_id                    │
│                                                 │
│ @INSERT:                                        │
│   WITH CHECK (auth.uid() = user_id)             │
│                                                 │
│ @UPDATE:                                        │
│   WHERE & WITH CHECK (auth.uid() = user_id)     │
│                                                 │
│ @DELETE:                                        │
│   WHERE (auth.uid() = user_id)                  │
│                                                 │
│ Result: ✓ Triple-layer security                │
└─────────────────────────────────────────────────┘
```

---

## 📱 User Interaction Flow

```
┌──────────────┐
│   HOME PAGE  │
└──────┬───────┘
       │ Click Image
       ▼
┌──────────────────┐
│  PIN DETAIL PAGE │────────────────┐
│  (Auto-records   │                │ useEffect triggers
│   view)          │                │ recordView()
└──────┬───────────┘                │
       │                            ▼
       │                    ┌────────────────┐
       │                    │  Supabase      │
       │                    │  Stores Record │
       │                    └──────┬─────────┘
       │                           │
       │ Click Menu                │
       │                           │
       ▼                           │
┌─────────────────────┐            │
│  DROPDOWN MENU      │            │
├─────────────────────┤            │
│ • Profile           │            │
│ • Saved Pins        │            │
│ • View History ◄────┼────────────┘
│ • Settings          │
│ • Logout            │
└──────────┬──────────┘
           │ Click "View History"
           ▼
┌──────────────────────────────┐
│   HISTORY PAGE               │
├──────────────────────────────┤
│ • Shows all viewed images    │
│ • 20 per page                │
│ • Search functionality       │
│ • Delete options             │
│ • Clear all button           │
└──────────────────────────────┘
       │
       ├─ Search ──► Filtered Results
       ├─ Delete ──► Item Removed
       ├─ Clear All ──► All Removed
       └─ Paginate ──► Next Page
```

---

## 🗄️ Database Relationships

```
Supabase Auth (Users)
        │
        │ user_id
        │ (Foreign Key)
        │
        ▼
┌──────────────────────────┐
│   image_history          │
├──────────────────────────┤
│ id (PK)                  │◄─── AUTO GENERATED
│ user_id (FK)             │◄─── FROM AUTH
│ image_id                 │
│ image_url                │
│ image_title              │
│ image_width              │
│ image_height             │
│ image_color              │
│ image_description        │
│ source                   │
│ viewed_at                │◄─── AUTO NOW
│ created_at               │◄─── AUTO NOW
└──────────────────────────┘
│
├─► Unique(user_id, image_id)
│   └─► Prevents duplicate entries per user
│
├─► Index(user_id, viewed_at DESC)
│   └─► Fast queries for user's history
│
└─► Index(user_id)
    └─► Fast lookups by user
```

---

## 🎯 Request/Response Examples

### Recording a View
```
REQUEST:
POST /rest/v1/image_history
Authorization: Bearer {user_jwt}
{
  "user_id": "abc-123",
  "image_id": "unsplash-456",
  "image_url": "https://...",
  "image_title": "Anime Landscape",
  "image_width": 1920,
  "image_height": 1080,
  "image_color": "#2c3e50",
  "image_description": "Beautiful anime landscape",
  "source": "unsplash",
  "viewed_at": "2024-01-17T10:30:00Z"
}

RESPONSE:
{
  "id": "hist-789",
  "user_id": "abc-123",
  "image_id": "unsplash-456",
  ...
  "created_at": "2024-01-17T10:30:00Z"
}
```

### Fetching History
```
REQUEST:
GET /rest/v1/image_history?user_id=abc-123&order=viewed_at.desc&limit=20&offset=0
Authorization: Bearer {user_jwt}

RESPONSE:
[
  {
    "id": "hist-789",
    "user_id": "abc-123",
    "image_id": "unsplash-456",
    "image_title": "Anime Landscape",
    "viewed_at": "2024-01-17T10:30:00Z",
    ...
  },
  {
    "id": "hist-788",
    "user_id": "abc-123",
    "image_id": "unsplash-455",
    "image_title": "Cyberpunk City",
    "viewed_at": "2024-01-16T15:20:00Z",
    ...
  }
]
```

---

## 📈 Performance Metrics

```
Operation           │ Complexity  │ Time Estimate
────────────────────┼─────────────┼──────────────
Record View         │ O(1)        │ ~50ms
Fetch History (20)  │ O(log n)    │ ~30ms
Search (50 results) │ O(n)        │ ~100ms
Delete Item         │ O(1)        │ ~40ms
Clear All           │ O(n)        │ ~100-200ms
Get Count           │ O(1)        │ ~20ms
```

---

## 🚀 Deployment Checklist

```
Frontend
├─ ✓ Components created
├─ ✓ Context added
├─ ✓ Hooks created
├─ ✓ Routes configured
├─ ✓ Integrations added
└─ ✓ Documentation complete

Backend
├─ ○ SQL migration (RUN IN SUPABASE)
├─ ○ Verify table created
├─ ○ Verify indexes created
├─ ○ Verify RLS policies active
└─ ○ Test queries manually

Testing
├─ ○ View image → record check
├─ ○ History page loads
├─ ○ Search works
├─ ○ Delete works
├─ ○ Clear all works
├─ ○ Mobile responsive
└─ ○ Persistence test

Production
├─ ○ Deploy frontend
├─ ○ Monitor logs
├─ ○ Track errors
└─ ○ Gather feedback
```

---

This architecture ensures:
- ✅ **Security** - RLS at database level
- ✅ **Performance** - Indexed queries
- ✅ **Scalability** - Efficient data storage
- ✅ **Maintainability** - Clear separation of concerns
- ✅ **Reliability** - Error handling at each layer
