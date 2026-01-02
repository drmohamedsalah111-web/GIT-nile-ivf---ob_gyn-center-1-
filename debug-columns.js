
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://purknrqalbkajufqfiqu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cmtucnFhbGJrYWp1ZnFmaXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MzgyMzksImV4cCI6MjA4MjAxNDIzOX0.iOKxs3jCn8TniDrLmaGAHsZP8AFy3IKkn9y5hJVUI14";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Checking doctors columns...');
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Failed:', error);
  } else {
    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('No data in doctors table, cannot infer columns easily via select *');
    }
  }
}

checkColumns();
