import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ladqitwqkkfiijregqlu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZHFpdHdxa2tmaWlqcmVncWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Njk0MDgsImV4cCI6MjA4MDQ0NTQwOH0.qSAjg1kIcAO5DFnz5InlW4u3pxzeDTIbLdB6uN_CEUc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('📊 Checking database...\n');

    const tables = ['patients', 'doctors', 'ivf_cycles', 'visits', 'pregnancies'];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count} records`);
        }
      } catch (err) {
        console.log(`⚠️ ${table}: ${err.message}`);
      }
    }

    console.log('\n🔐 Checking auth...');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ User logged in:', session.user.email);
      
      console.log('\n👤 Checking doctor profile...');
      const { data: doctor, error: docError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (docError) {
        console.log(`❌ Doctor profile: ${docError.message}`);
      } else if (doctor) {
        console.log(`✅ Doctor found:`, doctor.name);
      } else {
        console.log('⚠️ No doctor profile found for user');
      }
    } else {
      console.log('❌ No active session');
    }

    console.log('\n🗄️ Checking table structures...');
    const tables_info = ['information_schema.tables'];
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();
