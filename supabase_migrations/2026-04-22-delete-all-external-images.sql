-- Delete All External Images from Database
-- Keeps user-uploaded images (UUID format), deletes external API images

-- 1. First delete saved_images for non-user pins (to avoid foreign key issues)
DELETE FROM public.saved_images 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 2. Delete likes for non-user pins
DELETE FROM public.likes 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 3. Delete loves for non-user pins
DELETE FROM public.loves 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 4. Delete comments for non-user pins
DELETE FROM public.comments 
WHERE pin_id IN (
  SELECT id FROM public.pins 
  WHERE id NOT LIKE '______-______-____-____-____________'
);

-- 5. Delete all non-user pins (external API images)
DELETE FROM public.pins 
WHERE id NOT LIKE '______-______-____-____-____________';

-- 6. Also clean image_history if it exists (non-user images)
DELETE FROM public.image_history 
WHERE image_id NOT LIKE '______-______-____-____-____________';

-- Verify remaining (user-uploaded only)
SELECT COUNT(*) as user_images_remaining FROM public.pins 
WHERE id LIKE '______-______-____-____-____________';