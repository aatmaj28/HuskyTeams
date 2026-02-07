// Run this script to create the otp_verifications table
// Usage: node scripts/create-otp-table.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createOTPTable() {
    console.log('Creating otp_verifications table...');

    // Try to insert a test record to see if table exists
    const { error: testError } = await supabase
        .from('otp_verifications')
        .select('id')
        .limit(1);

    if (testError && testError.code === '42P01') {
        // Table doesn't exist - need to create it via Supabase Dashboard SQL Editor
        console.log(`
================================================================================
The otp_verifications table needs to be created.

Please run the following SQL in your Supabase Dashboard SQL Editor:
(Dashboard -> SQL Editor -> New Query)

CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role has full access" ON otp_verifications
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_otp_verifications_email ON otp_verifications(email);
================================================================================
    `);
    } else if (testError) {
        console.error('Error checking table:', testError.message);
    } else {
        console.log('✓ otp_verifications table already exists!');
    }
}

createOTPTable();
