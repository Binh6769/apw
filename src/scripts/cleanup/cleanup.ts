#!/usr/bin/env node
/**
 * Database & Storage Cleanup Script
 * Deletes all non-user-generated images from the platform
 * 
 * Usage:
 *   npm run cleanup:dry-run   # Preview what will be deleted
 *   npm run cleanup:execute # Run actual cleanup
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const command = process.argv[2] || 'dry-run';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    console.error('.env file not found');
    process.exit(1);
  }
  
  const envContent = readFileSync(envPath, 'utf-8');
  const config: Record<string, string> = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      config[key] = val;
    }
  });
  
  const url = config.VITE_SUPABASE_URL;
  const anonKey = config.VITE_SUPABASE_ANON_KEY;
  const serviceKey = config.SUPABASE_SERVICE_KEY;
  
  if (!url || !anonKey) {
    console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required in .env');
    process.exit(1);
  }
  
  return { url, anonKey, serviceKey };
}

const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceKey } = loadEnv();

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

const EXTERNAL_DOMAINS = [
  'reddit.com', 'i.redd.it', 'imgur', 'pexels', 'unsplash', 'pinimg', 
  'waifu.im', 'myanimelist', 'danbooru', 'safebooru', 'gelbooru', 
  'rule34', 'hinata', 'zerochan', 'konachan', 'yande.re', 'e-hentai'
];

function isExternalPin(pin: { source_url?: string; image_url?: string }): boolean {
  const url = pin.source_url || pin.image_url || '';
  return EXTERNAL_DOMAINS.some(d => url.includes(d));
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('  AP Web Cleanup Script');
  console.log('========================================');
  console.log('');
  
  if (command === 'execute') {
    console.log('⚠️  MODE: EXECUTE (will delete data)');
  } else {
    console.log('🔍 MODE: DRY RUN (preview only)');
  }
  console.log('');
  
  // Fetch ALL pins
  console.log('[1] Fetching all pins...');
  const { data: pins, error } = await supabase
    .from('pins')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching pins:', error);
    return;
  }
  
  const allPins = pins || [];
  console.log(`    Total pins in DB: ${allPins.length}`);
  
  // Categorize
  const externalPins = allPins.filter(isExternalPin);
  const userPins = allPins.filter(p => !isExternalPin(p));
  
  console.log('');
  console.log('[2] Pin categorization:');
  console.log(`    External (imported): ${externalPins.length}`);
  console.log(`    User uploads: ${userPins.length}`);
  console.log('');
  
  // Show sample
  console.log('[3] External pins to delete (sample 10):');
  externalPins.slice(0, 10).forEach(p => {
    console.log(`    ❌ ${p.id.substring(0, 8)}... | ${(p.title || 'Untitled').substring(0, 30)}`);
    console.log(`       image_url: ${(p.image_url || '').substring(0, 50)}`);
    console.log(`       source_url: ${(p.source_url || '').substring(0, 50)}`);
  });
  console.log('');
  
  if (command === 'execute') {
    if (!supabaseAdmin) {
      console.error('❌ SUPABASE_SERVICE_KEY required for deletions');
      console.error('   Add SUPABASE_SERVICE_KEY to .env file');
      process.exit(1);
    }
    
    if (externalPins.length === 0) {
      console.log('✅ No external pins to delete. Database is clean!');
    } else {
      console.log('[4] Deleting external pins...');
      
      // Get IDs to delete
      const idsToDelete = externalPins.map(p => p.id);
      
      // Delete in FK order - get related counts first
      const [saved, likes, loves, comments] = await Promise.all([
        supabase.from('saved_images').select('id').in('pin_id', idsToDelete),
        supabase.from('likes').select('id').in('pin_id', idsToDelete),
        supabase.from('loves').select('id').in('pin_id', idsToDelete),
        supabase.from('comments').select('id').in('pin_id', idsToDelete),
      ]);
      
      const deleteCounts = { saved: 0, likes: 0, loves: 0, comments: 0, pins: 0 };
      
      // Delete related records
      if (saved.data?.length) {
        await supabaseAdmin.from('saved_images').delete().in('pin_id', idsToDelete);
        deleteCounts.saved = saved.data.length;
      }
      if (likes.data?.length) {
        await supabaseAdmin.from('likes').delete().in('pin_id', idsToDelete);
        deleteCounts.likes = likes.data.length;
      }
      if (loves.data?.length) {
        await supabaseAdmin.from('loves').delete().in('pin_id', idsToDelete);
        deleteCounts.loves = loves.data.length;
      }
      if (comments.data?.length) {
        await supabaseAdmin.from('comments').delete().in('pin_id', idsToDelete);
        deleteCounts.comments = comments.data.length;
      }
      
      // Delete pins
      const { error: deleteError } = await supabaseAdmin
        .from('pins')
        .delete()
        .in('id', idsToDelete);
      
      if (deleteError) {
        console.error('Error deleting pins:', deleteError);
      } else {
        deleteCounts.pins = idsToDelete.length;
      }
      
      console.log('');
      console.log('    Deleted:');
      console.log(`    - saved_images: ${deleteCounts.saved}`);
      console.log(`    - likes: ${deleteCounts.likes}`);
      console.log(`    - loves: ${deleteCounts.loves}`);
      console.log(`    - comments: ${deleteCounts.comments}`);
      console.log(`    - pins: ${deleteCounts.pins}`);
      console.log('');
      console.log('✅ Cleanup complete!');
    }
    
    // Verify remaining
    const { count } = await supabase
      .from('pins')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total remaining pins: ${count}`);
    
  } else {
    console.log('[4] DRY RUN - No deletions performed');
    console.log('');
    console.log('To execute: npm run cleanup:execute');
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});