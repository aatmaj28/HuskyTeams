#!/usr/bin/env node

/**
 * Helper script to add POSTGRES_URL_NON_POOLING to .env.local
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('Please run: npm run setup:env\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// Check if POSTGRES_URL_NON_POOLING already exists
if (envContent.includes('POSTGRES_URL_NON_POOLING')) {
  console.log('✅ POSTGRES_URL_NON_POOLING already exists in .env.local\n');
  process.exit(0);
}

// Add the connection string
const postgresUrl = 'postgres://postgres.wptmedheqnukgpyntzte:guhn8e0qDZtaY6oy@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

const newContent = envContent.trim() + '\n\n# PostgreSQL Direct Connection (for migrations)\nPOSTGRES_URL_NON_POOLING=' + postgresUrl + '\n';

fs.writeFileSync(envPath, newContent);
console.log('✅ Added POSTGRES_URL_NON_POOLING to .env.local\n');
console.log('You can now run: npm run db:migrate\n');
