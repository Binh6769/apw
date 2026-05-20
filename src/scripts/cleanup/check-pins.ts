import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nndzprkjdzwnxgwbrswl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZHpwcmtqZHp3bnhnd2Jyc3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODM0MDgsImV4cCI6MjA4MzM1OTQwOH0.rQJpPdkIdMQLtyFGjGIpVyy2eVpnETl1N4R2OZkrA8A'
);

async function main() {
  const { data: pins, error } = await supabase.from('pins').select('id, user_id, source_url, image_url');
  if (error) console.error(error);
  else pins.forEach(p => console.log(`${p.id.substring(0,8)} | user:${p.user_id?.substring(0,8)} | ${(p.source_url || p.image_url || '').substring(0,50)}`));
}

main().then(() => console.log('Done')).catch(e => console.error(e));
