const SUPABASE_URL = 'https://xisychoksilrwwesfosk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc3ljaG9rc2lscnd3ZXNmb3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTY2ODgsImV4cCI6MjA4NTU3MjY4OH0.bS9nulaPlE-XQ4e69SfJrtJ9FFAe5fFanaJHhIkdSbQ';

async function verifySetup() {
  console.log('🔍 Verifying Supabase Setup...\n');

  const tables = [
    'donor_codes',
    'agencies', 
    'financial_years',
    'users',
    'projects',
    'budget_lines',
    'cashflow_monthly',
    'workflow_actions',
    'attachments',
    'audit_logs'
  ];

  let allPassed = true;

  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'count=exact'
        }
      });

      if (response.ok) {
        const contentRange = response.headers.get('content-range');
        const count = contentRange ? contentRange.split('/')[1] : '?';
        console.log(`✅ ${table}: ${count} rows`);
      } else {
        console.log(`❌ ${table}: Error ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error}`);
      allPassed = false;
    }
  }

  console.log('\n--- Storage Bucket ---');
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket/attachments`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      }
    });
    
    if (response.ok) {
      console.log('✅ attachments bucket: exists');
    } else if (response.status === 400) {
      console.log('⚠️  attachments bucket: not found (run storage-setup.sql)');
    } else {
      console.log(`⚠️  attachments bucket: status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Storage check failed: ${error}`);
  }

  console.log('\n' + (allPassed ? '✅ All tables verified!' : '⚠️  Some tables need attention'));
}

verifySetup();
