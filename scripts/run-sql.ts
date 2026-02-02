import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://xisychoksilrwwesfosk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc3ljaG9rc2lscnd3ZXNmb3NrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk5NjY4OCwiZXhwIjoyMDg1NTcyNjg4fQ.DtTetX8lSYDTgDLUnYBZxyVyaSk9GN_OmUAcHxY38Cg';

interface SQLResult {
  error?: { message: string };
  data?: unknown;
}

async function runSQLQuery(sql: string): Promise<SQLResult> {
  // Use the Supabase SQL API endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { error: { message: `HTTP ${response.status}: ${text}` } };
  }

  try {
    const data = await response.json();
    return { data };
  } catch {
    return { data: null };
  }
}

// Split SQL into executable statements
function splitStatements(sql: string): string[] {
  // Remove comments and split by semicolons, handling DO blocks
  const statements: string[] = [];
  let current = '';
  let inDoBlock = false;
  let dollarQuote = '';

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comment-only lines
    if (trimmed.startsWith('--')) continue;

    // Track DO blocks and dollar-quoted strings
    if (trimmed.match(/DO\s*\$\$/i)) {
      inDoBlock = true;
      dollarQuote = '$$';
    }

    current += line + '\n';

    // Check for end of DO block
    if (inDoBlock && trimmed.includes('$$;')) {
      inDoBlock = false;
      statements.push(current.trim());
      current = '';
      continue;
    }

    // Regular statement ending
    if (!inDoBlock && trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  // Add any remaining statement
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter(s => s.length > 0 && !s.startsWith('--'));
}

async function runSQL() {
  console.log('Setting up Supabase database...\n');

  // First, let's try to check if tables exist by querying
  console.log('Testing connection...');

  // Read schema SQL
  const schemaPath = join(process.cwd(), 'supabase', 'schema.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');

  // Read seed SQL
  const seedPath = join(process.cwd(), 'supabase', 'seed.sql');
  const seedSql = readFileSync(seedPath, 'utf-8');

  console.log('\n=== SCHEMA SQL ===');
  console.log('Length:', schemaSql.length, 'characters');
  console.log('\n=== SEED SQL ===');
  console.log('Length:', seedSql.length, 'characters');

  console.log('\n⚠️  Direct SQL execution via REST API is not available.');
  console.log('\n📋 Please follow these manual steps:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/xisychoksilrwwesfosk/sql/new');
  console.log('2. Copy the contents of supabase/schema.sql and paste it in the editor');
  console.log('3. Click "Run" to execute the schema');
  console.log('4. Copy the contents of supabase/seed.sql and paste it in the editor');
  console.log('5. Click "Run" to execute the seed data');
  console.log('\nThe SQL files are located at:');
  console.log(`  - Schema: ${schemaPath}`);
  console.log(`  - Seed: ${seedPath}`);

  // Let's verify if we can at least query existing tables
  console.log('\n--- Testing database access via REST API ---');

  const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  if (testResponse.ok) {
    console.log('✅ REST API is accessible');

    // Try to query donor_codes to see if schema exists
    const donorResponse = await fetch(`${SUPABASE_URL}/rest/v1/donor_codes?select=count`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact',
      },
    });

    if (donorResponse.ok) {
      const count = donorResponse.headers.get('content-range');
      console.log(`✅ Schema exists! Donor codes count: ${count}`);
    } else {
      console.log('⚠️  Schema not yet created. Please run the SQL files manually.');
    }
  } else {
    console.log('❌ REST API not accessible:', testResponse.status);
  }
}

runSQL().catch(console.error);
