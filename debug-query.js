
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://purknrqalbkajufqfiqu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cmtucnFhbGJrYWp1ZnFmaXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MzgyMzksImV4cCI6MjA4MjAxNDIzOX0.iOKxs3jCn8TniDrLmaGAHsZP8AFy3IKkn9y5hJVUI14";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('Testing query 1 (Explicit FK)...');
  const { data, error } = await supabase
    .from('clinic_subscriptions')
    .select(`
      *,
      doctors!clinic_id(full_name, email, phone),
      subscription_plans!plan_id(*)
    `)
    .limit(1);

  if (error) {
    console.error('Query 1 failed:', error);
  } else {
    console.log('Query 1 successful');
  }
  
  console.log('Testing query 2 (Implicit)...');
  const { data: data2, error: error2 } = await supabase
    .from('clinic_subscriptions')
    .select(`
      *,
      doctors(full_name, email, phone),
      subscription_plans(*)
    `)
    .limit(1);

    if (error2) {
        console.error('Query 2 failed:', error2);
    } else {
        console.log('Query 2 successful');
    }
}

testQuery();
