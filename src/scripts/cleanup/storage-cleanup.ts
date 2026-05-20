import { supabase } from '../services/supabase';

interface Pin {
  id: string;
  image_url: string;
}

/**
 * Storage Cleanup Script
 * Deletes orphaned image files from Supabase storage bucket
 * that were associated with deleted (external) pins.
 * 
 * Run AFTER database-cleanup.sql
 * 
 * Usage: npx tsx src/scripts/cleanup/storage-cleanup.ts
 */

const STORAGE_BUCKET = 'pin-images';

async function fetchExternalPinImages(): Promise<Pin[]> {
  const { data, error } = await supabase
    .from('pins')
    .select('id, image_url')
    .not('id', 'like', '______-______-____-____-____________');

  if (error) {
    console.error('Error fetching pins:', error);
    return [];
  }

  return data || [];
}

function extractStoragePath(imageUrl: string): string | null {
  try {
    if (!imageUrl) return null;
    
    // If URL contains bucket path, extract it
    if (imageUrl.includes(STORAGE_BUCKET)) {
      const parts = imageUrl.split(`${STORAGE_BUCKET}/`);
      return parts[1] || null;
    }
    
    // If it's already a path (userId/timestamp.ext)
    if (imageUrl.includes('/') && !imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    return null;
  } catch {
    return null;
  }
}

async function deleteStorageFiles(paths: string[]): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  // Supabase storage.remove() accepts array of paths
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(paths);

  if (error) {
    console.error('Storage deletion error:', error);
    return { success: [], failed: paths };
  }

  return { success: paths, failed: [] };
}

async function dryRun() {
  console.log('=== STORAGE CLEANUP DRY RUN ===\n');
  
  const pins = await fetchExternalPinImages();
  console.log(`Found ${pins.length} external pins to check for storage files\n`);
  
  const pathsToDelete: string[] = [];
  
  for (const pin of pins) {
    const path = extractStoragePath(pin.image_url);
    if (path) {
      pathsToDelete.push(path);
    }
  }
  
  // Deduplicate paths
  const uniquePaths = [...new Set(pathsToDelete)];
  
  console.log(`Unique storage paths to delete: ${uniquePaths.length}`);
  console.log('Sample paths:', uniquePaths.slice(0, 10).join('\n  '));
  
  return uniquePaths;
}

async function execute() {
  console.log('=== STORAGE CLEANUP EXECUTION ===\n');
  
  const pins = await fetchExternalPinImages();
  
  const pathsToDelete: string[] = [];
  
  for (const pin of pins) {
    const path = extractStoragePath(pin.image_url);
    if (path) {
      pathsToDelete.push(path);
    }
  }
  
  const uniquePaths = [...new Set(pathsToDelete)];
  
  console.log(`Deleting ${uniquePaths.length} storage files...`);
  
  const result = await deleteStorageFiles(uniquePaths);
  
  console.log(`\nSuccess: ${result.success.length} files`);
  console.log(`Failed: ${result.failed.length} files`);
  
  if (result.failed.length > 0) {
    console.log('Failed paths:', result.failed);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'dry-run';

if (command === 'dry-run') {
  dryRun();
} else if (command === 'execute') {
  execute();
} else {
  console.log('Usage:');
  console.log('  npx tsx src/scripts/cleanup/storage-cleanup.ts dry-run');
  console.log('  npx tsx src/scripts/cleanup/storage-cleanup.ts execute');
}