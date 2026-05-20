-- =====================================================
-- DRY RUN: Preview what will be deleted
-- Run this FIRST to verify target data
-- =====================================================

-- 1. Preview: All non-UUID pins (external/seeded)
SELECT 'pins' as table_name, COUNT(*) as count
FROM public.pins 
WHERE id NOT LIKE '______-______-____-____-____________'
UNION ALL
-- 2. Preview: saved_images for external pins
SELECT 'saved_images', COUNT(*)
FROM public.saved_images 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
)
UNION ALL
-- 3. Preview: likes for external pins
SELECT 'likes', COUNT(*)
FROM public.likes 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
)
UNION ALL
-- 4. Preview: loves for external pins
SELECT 'loves', COUNT(*)
FROM public.loves 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
)
UNION ALL
-- 5. Preview: comments for external pins
SELECT 'comments', COUNT(*)
FROM public.comments 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
)
UNION ALL
-- 6. Preview: image_history for external images
SELECT 'image_history', COUNT(*)
FROM public.image_history 
WHERE image_id NOT LIKE '______-______-____-____-____________';

-- =====================================================
-- Also show SAMPLE external pin IDs for verification
-- =====================================================
SELECT id, title, image_url, source_url, created_at
FROM public.pins 
WHERE id NOT LIKE '______-______-____-____-____________'
ORDER BY created_at DESC
LIMIT 20;