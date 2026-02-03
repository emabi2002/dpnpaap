import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xisychoksilrwwesfosk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc3ljaG9rc2lscnd3ZXNmb3NrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk5NjY4OCwiZXhwIjoyMDg1NTcyNjg4fQ.DtTetX9lSYDTgDLUnYBZxyVyaSk9GN_OmUAcHxY38Cg';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface TableCheck {
  name: string;
  exists: boolean;
  count?: number;
  error?: string;
}

async function checkTable(tableName: string): Promise<TableCheck> {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { name: tableName, exists: false, error: error.message };
    }

    return { name: tableName, exists: true, count: count || 0 };
  } catch (err) {
    return { name: tableName, exists: false, error: String(err) };
  }
}

async function verifyProcurement() {
  console.log('🔍 Verifying Procurement Tables in Supabase...\n');

  const procurementTables = [
    'fund_sources',
    'procurement_methods',
    'contract_types',
    'units_of_measure',
    'provinces',
    'districts',
    'unspsc_codes',
    'procurement_plans',
    'procurement_plan_items',
    'procurement_workflow_actions',
  ];

  const results: TableCheck[] = [];

  for (const table of procurementTables) {
    const result = await checkTable(table);
    results.push(result);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TABLE                          STATUS          COUNT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let allExist = true;
  for (const result of results) {
    const status = result.exists ? '✅ Exists' : '❌ Missing';
    const count = result.exists ? String(result.count) : '-';
    console.log(
      `${result.name.padEnd(30)} ${status.padEnd(15)} ${count}`
    );
    if (!result.exists) allExist = false;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (allExist) {
    console.log('✅ All procurement tables exist in Supabase!');
    console.log('\n📊 Checking data counts...\n');

    // Get some sample data
    const { data: fundSources } = await supabase.from('fund_sources').select('code, name').limit(5);
    const { data: methods } = await supabase.from('procurement_methods').select('code, name').limit(5);
    const { data: plans } = await supabase.from('procurement_plans').select('plan_name, status').limit(5);

    if (fundSources && fundSources.length > 0) {
      console.log('Fund Sources:');
      fundSources.forEach((fs: { code: string; name: string }) => console.log(`  - ${fs.code}: ${fs.name}`));
    }

    if (methods && methods.length > 0) {
      console.log('\nProcurement Methods:');
      methods.forEach((m: { code: string; name: string }) => console.log(`  - ${m.code}: ${m.name}`));
    }

    if (plans && plans.length > 0) {
      console.log('\nProcurement Plans:');
      plans.forEach((p: { plan_name: string; status: string }) => console.log(`  - ${p.plan_name} (${p.status})`));
    } else {
      console.log('\n⚠️  No procurement plans found. Run procurement-sample-plans.sql for test data.');
    }
  } else {
    console.log('❌ Some procurement tables are missing!');
    console.log('\n📋 To deploy procurement tables, run these SQL files in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/xisychoksilrwwesfosk/sql/new\n');
    console.log('   1. supabase/procurement-schema.sql');
    console.log('   2. supabase/procurement-seed.sql');
    console.log('   3. supabase/procurement-sample-plans.sql (optional)');
  }
}

verifyProcurement().catch(console.error);
