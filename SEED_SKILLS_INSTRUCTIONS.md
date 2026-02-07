# How to Seed Skills in Your Database

The skills table is currently empty. Follow these steps to populate it:

## Option 1: Using Supabase SQL Editor (Recommended - Easiest)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the Seed Script**
   - Open the file: `scripts/002_seed_skills.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Run the Query**
   - Click "Run" button (or press Ctrl+Enter / Cmd+Enter)
   - You should see "Success. No rows returned"

5. **Verify Skills Were Added**
   - Go to "Table Editor" in the left sidebar
   - Click on the `skills` table
   - You should see ~100+ skills listed

## Option 2: Using Migration Script (Local)

If you prefer to run it locally:

```bash
cd student-networking-app
npm run db:migrate
```

This will run all migrations including the skills seed.

## After Seeding

Once skills are seeded, refresh your onboarding page and you should see all the skills organized by category:
- Programming Languages
- Machine Learning & AI
- ML/AI Frameworks
- Data Science
- Data Science Tools
- Databases
- Cloud & Infrastructure
- Web Development
- Tools & Practices
- Specialized AI
- Research & Academic
- Domain Knowledge
