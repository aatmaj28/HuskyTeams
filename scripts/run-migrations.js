#!/usr/bin/env node

/**
 * Database Migration Script
 * Automatically runs SQL migration files against Supabase
 * 
 * Usage: node scripts/run-migrations.js
 * Or: npm run db:migrate
 */

const fs = require('fs');
const path = require('path');

// Load .env.local manually (since Next.js doesn't auto-load it for Node scripts)
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

// Check if pg is available, if not, provide instructions
let pg;
try {
  pg = require('pg');
} catch (e) {
  console.error('\n❌ Error: "pg" package not found.');
  console.log('\n📦 Installing required package...\n');
  console.log('Please run: npm install pg --save-dev\n');
  console.log('Then run this script again.\n');
  process.exit(1);
}

const { Client } = pg;

async function runMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Try to get connection from POSTGRES_URL if available
  const postgresUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  
  if (!postgresUrl && (!supabaseUrl || !serviceRoleKey)) {
    console.error('\n❌ Error: Missing environment variables!');
    console.log('\nRequired in .env.local:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    console.log('  OR');
    console.log('  - POSTGRES_URL_NON_POOLING (direct database connection)\n');
    console.log('Get these from: Supabase Dashboard → Settings → API\n');
    process.exit(1);
  }

  let client;
  
  if (postgresUrl) {
    // Use direct PostgreSQL connection
    console.log('🔌 Connecting to database via PostgreSQL connection string...\n');
    // Replace sslmode in connection string and configure SSL properly
    let connectionString = postgresUrl;
    // Remove sslmode from URL and handle it in client config
    connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');
    
    const connectionConfig = {
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    };
    client = new Client(connectionConfig);
  } else {
    // Extract database connection info from Supabase URL
    // This is a fallback - direct POSTGRES_URL is preferred
    console.error('\n❌ Direct PostgreSQL connection string (POSTGRES_URL_NON_POOLING) not found.');
    console.log('Please add POSTGRES_URL_NON_POOLING to your .env.local file.');
    console.log('Get it from: Supabase Dashboard → Settings → Database → Connection string\n');
    process.exit(1);
  }

  try {
    await client.connect();
    console.log('✅ Connected to database!\n');

    // Migration files in order
    const migrationFiles = [
      '001_create_tables.sql',
      '002_seed_skills.sql',
      '003_add_profile_columns.sql',
      '004_fix_team_members_rls.sql',
      '005_fix_team_members_rls_v2.sql',
      '006_fix_team_members_rls_final.sql',
      '007_fix_team_members_rls_simple.sql',
      '009_fix_team_members_select_rls.sql',
      '010_remove_leader_concept.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (file not found)`);
        continue;
      }

      console.log(`📄 Running ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ ${file} completed successfully!\n`);
      } catch (error) {
        // Some errors are okay (like "table already exists" or "duplicate key")
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('ON CONFLICT')) {
          console.log(`⚠️  ${file} - Some statements skipped (already applied): ${error.message.split('\n')[0]}\n`);
        } else {
          console.error(`❌ Error in ${file}:`);
          console.error(error.message);
          console.log('\n');
          // Continue with other migrations
        }
      }
    }

    // Verify skills were seeded
    const result = await client.query('SELECT COUNT(*) as count FROM skills');
    const skillCount = parseInt(result.rows[0].count);
    console.log(`📊 Skills in database: ${skillCount}`);
    
    if (skillCount === 0) {
      console.log('⚠️  Warning: No skills found. Make sure 002_seed_skills.sql ran successfully.\n');
    } else {
      console.log('✅ Skills seeded successfully!\n');
    }

    console.log('🎉 All migrations completed!\n');
    
  } catch (error) {
    console.error('\n❌ Migration error:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
