import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nndzprkjdzwnxgwbrswl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZHpwcmtqZHp3bnhnd2Jyc3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODM0MDgsImV4cCI6MjA4MzM1OTQwOH0.rQJpPdkIdMQLtyFGjGIpVyy2eVpnETl1N4R2OZkrA8A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EXTERNAL_DOMAINS = [
  'reddit.com', 'i.redd.it', 'imgur', 'pexels', 'unsplash', 'pinimg', 
  'waifu.im', 'myanimelist', 'danbooru', 'safebooru', 'gelbooru', 
  'rule34', 'hinata', 'zerochan', 'konachan', 'yande.re', 'e-hentai',
  'cdn.myanimelist.net', 'cdn.waifu.im'
];

function isExternalPin(pin: { source_url?: string; image_url?: string }): boolean {
  const url = pin.source_url || pin.image_url || '';
  return EXTERNAL_DOMAINS.some(d => url.includes(d));
}

async function cleanupExternalPins() {
  console.log('Fetching all pins...');
  
  const { data: pins, error } = await supabase
    .from('pins')
    .select('id, title, source_url, image_url, user_id');
  
  if (error) {
    console.error('Error fetching pins:', error);
    return;
  }
  
  const allPins = pins || [];
  console.log(`Total pins: ${allPins.length}`);
  
  const externalPins = allPins.filter(isExternalPin);
  const userPins = allPins.filter(p => !isExternalPin(p));
  
  console.log(`External pins: ${externalPins.length}`);
  console.log(`User uploads: ${userPins.length}`);
  
  if (externalPins.length === 0) {
    console.log('No external pins to delete!');
    return;
  }
  
  console.log('\nDeleting external pins...');
  
  const externalIds = externalPins.map(p => p.id);
  
  // First delete related records
  try { await supabase.from('saved_pins').delete().in('pin_id', externalIds); } catch {}
  try { await supabase.from('likes').delete().in('pin_id', externalIds); } catch {}
  try { await supabase.from('loves').delete().in('pin_id', externalIds); } catch {}
  try { await supabase.from('comments').delete().in('pin_id', externalIds); } catch {}
  
  // Then delete the pins
  const { data: deleteResult, error: deleteError } = await supabase
    .from('pins')
    .delete()
    .in('id', externalIds)
    .select();
  
  console.log('Deleted count:', deleteResult?.length || 0);
  if (deleteError) {
    console.error('Error deleting pins:', deleteError);
  } else {
    console.log(`Successfully deleted ${externalPins.length} external pins!`);
  }
  
  // Wait a moment and verify
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const { data: remaining } = await supabase.from('pins').select('id');
  console.log(`Remaining pins: ${remaining?.length || 0}`);
  if (remaining && remaining.length > 0) {
    console.log('Remaining pin IDs:', remaining.map(r => r.id.substring(0, 8)));
  }
}

cleanupExternalPins();