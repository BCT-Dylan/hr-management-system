// Debug script for testing Supabase connection
// Run this in browser console to test connection

console.log('=== Supabase Debug Test ===');

// 1. Check environment variables
console.log('Environment Variables:');
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING');
console.log('Key length:', process.env.REACT_APP_SUPABASE_ANON_KEY?.length || 0);

// 2. Test Subabase client creation
import { supabase } from '../lib/supabase';
console.log('Supabase client:', supabase);

// 3. Test simple query
async function testConnection() {
  try {
    console.log('Testing connection...');
    const { data, error } = await supabase.from('jobs').select('count').limit(1);
    
    if (error) {
      console.error('Connection error:', error);
      console.error('Error details:', error.message, error.details, error.hint);
    } else {
      console.log('Connection successful:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// 4. Test job creation with minimal data
async function testJobCreation() {
  try {
    console.log('Testing job creation...');
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        title: 'Test Job',
        department: 'Test Department',
        location: 'Test Location',
        job_type: 'fullTime',
        description: 'Test Description'
      })
      .select();
    
    if (error) {
      console.error('Job creation error:', error);
      console.error('Error details:', error.message, error.details, error.hint);
    } else {
      console.log('Job creation successful:', data);
    }
  } catch (err) {
    console.error('Unexpected job creation error:', err);
  }
}

// Run tests
testConnection();
// testJobCreation(); // Uncomment to test job creation