# 🔧 Environment Variables Setup

You're seeing this error because the Supabase environment variables are missing.

## Quick Fix (Choose One Method)

### Method 1: Use the Setup Script (Easiest)

```bash
npm run setup:env
```

This will prompt you for your Supabase credentials and create the `.env.local` file automatically.

### Method 2: Create Manually

1. Create a file named `.env.local` in the `student-networking-app` directory

2. Add the following content (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Get your credentials from:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Settings** → **API**
   - Copy:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Method 3: PowerShell (Windows)

```powershell
# Create the file
New-Item -Path ".env.local" -ItemType File -Force

# Add content (replace with your values)
@"
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
"@ | Set-Content -Path ".env.local"
```

Then edit `.env.local` with your actual Supabase credentials.

## After Creating .env.local

1. **Restart your dev server:**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again

2. **Verify it works:**
   - The error should be gone
   - The app should load at http://localhost:3000

## Don't Have a Supabase Project Yet?

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in project details and create
4. Wait 1-2 minutes for setup
5. Go to **Settings** → **API** to get your credentials
6. Run the database setup: Go to **SQL Editor** → Run `scripts/001_create_tables.sql`

## Important Notes

- ✅ `.env.local` is already in `.gitignore` - it won't be committed
- ✅ Never share your Supabase keys publicly
- ✅ The `NEXT_PUBLIC_` prefix makes these available in the browser (safe for anon key)
- ⚠️ Don't use the `service_role` key in frontend code (it's secret!)

## Still Having Issues?

Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide for more help.
