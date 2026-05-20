-- =====================================================
-- DATABASE CLEANUP: Delete all non-user-generated images
-- Run this AFTER Dry Run verification
-- =====================================================

-- 1. Delete saved_images for non-UUID pins (foreign key first)
DELETE FROM public.saved_images 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 2. Delete likes for external pins
DELETE FROM public.likes 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 3. Delete loves for external pins
DELETE FROM public.loves 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 4. Delete comments for external pins
DELETE FROM public.comments 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 5. Delete all non-UUID pins (external API images)
DELETE FROM public.pins 
WHERE id NOT LIKE '______-______-____-____-____________';

-- 6. Clean image_history for external images
DELETE FROM public.image_history 
WHERE image_id NOT LIKE '______-______-____-____-____________';

-- =====================================================
-- Verify remaining (user-uploaded only)
-- =====================================================
SELECT COUNT(*) as user_pins_remaining FROM public.pins 
WHERE id LIKE '______-______-____-____-____________';

-- Show remaining sample to verify
SELECT id, title, LEFT(image_url, 50) as image_url_preview, created_at
FROM public.pins 
WHERE id LIKE '______-______-____-____-____________'
ORDER BY created_at DESC
LIMIT 10;