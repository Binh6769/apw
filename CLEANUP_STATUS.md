========================================
  AP Web Cleanup - Execution Ready
========================================

STATUS: ✅ DRY RUN COMPLETE

The script has identified:

  📊 Total pins in DB: 28
  ❌ External (imported): 28
  ✅ User uploads: 0

External pins to delete (sample):
  - myanimelist.net images (2 pins)
  - cdn.waifu.im images (26 pins)

---

TO EXECUTE THE CLEANUP:

1. Get your SUPABASE_SERVICE_KEY:
   - Go to Supabase Dashboard
   - Settings → API
   - Find "Service Role Key" (click eye icon to reveal)
   - Copy the key

2. Add to .env file:
   SUPABASE_SERVICE_KEY=your_service_role_key_here

3. Run:
   npm run cleanup:execute

---

IDENTIFICATION CRITERIA USED:

External domains detected:
- reddit.com, i.redd.it, imgur
- pexels, unsplash
- waifu.im, myanimelist.net
- danbooru, safebooru, gelbooru
- Other anime/image boards

User uploads are pins that:
- Have NO source_url (uploaded directly)
- Have image_url from Supabase storage

---

⚠️  WARNING: This will PERMANENTLY DELETE:
- 28 pins
- All related likes, loves, comments, saved_images
- This action cannot be undone!