import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ladqitwqkkfiijregqlu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZHFpdHdxa2tmaWlqcmVncWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Njk0MDgsImV4cCI6MjA4MDQ0NTQwOH0.qSAjg1kIcAO5DFnz5InlW4u3pxzeDTIbLdB6uN_CEUc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  try {
    console.log('🔍 DEBUGGING DATA SYNC\n');

    console.log('0️⃣ Checking current user...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`Current user: ${user?.email || 'No user logged in'}`);

    console.log('\n1️⃣ Checking doctors...');
    const { data: doctors, error: docError } = await supabase.from('doctors').select('*');
    if (docError) console.error('Error:', docError.message);
    console.log(`Found ${doctors?.length || 0} doctors`);
    if (doctors && doctors.length > 0) {
      doctors.forEach(d => {
        console.log(`- ${d.name} (user_id: ${d.user_id})`);
      });
    }

    console.log('\n2️⃣ Checking patients...');
    const { data: patients, error: patError } = await supabase.from('patients').select('*');
    if (patError) console.error('Error:', patError.message);
    console.log(`Found ${patients?.length || 0} patients`);
    if (patients && patients.length > 0) {
      patients.forEach(p => {
        console.log(`- ${p.name} (doctor_id: ${p.doctor_id})`);
      });
    }

    console.log('\n3️⃣ Checking IVF cycles...');
    const { data: cycles, error: cycError } = await supabase.from('ivf_cycles').select('*');
    if (cycError) console.error('Error:', cycError.message);
    console.log(`Found ${cycles?.length || 0} cycles`);

    console.log('\n4️⃣ Checking visits...');
    const { data: visits, error: visError } = await supabase.from('visits').select('*');
    if (visError) console.error('Error:', visError.message);
    console.log(`Found ${visits?.length || 0} visits`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debug();
