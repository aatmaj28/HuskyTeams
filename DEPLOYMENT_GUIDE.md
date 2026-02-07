# 🚀 Complete Deployment Guide: Vercel + Supabase

This guide will walk you through deploying your Team Matching App to Vercel with Supabase as the backend.

---

## 📋 Prerequisites Checklist

- [ ] GitHub account (for version control)
- [ ] Vercel account (free tier works)
- [ ] Supabase account (free tier works)
- [ ] Node.js 18+ installed locally
- [ ] Git installed

---

## Part 1: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: `team-match-app` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you (e.g., `US East`)
   - **Pricing Plan**: Free tier is fine
4. Click **"Create new project"** (takes 1-2 minutes)

### Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (keep this secret! Only for server-side)

### Step 3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste the contents of `scripts/001_create_tables.sql`
4. Click **"Run"** (or press `Ctrl+Enter`)
5. Verify tables were created: Go to **Table Editor** → you should see:
   - `profiles`
   - `skills`
   - `profile_skills`
   - `profile_looking_for`
   - `availability`
   - `project_interests`
   - `interest_requests`
   - `teams`
   - `team_members`

### Step 4: Seed Skills Data (Optional but Recommended)

1. In **SQL Editor**, create a new query
2. Copy and paste the contents of `scripts/002_seed_skills.sql`
3. Click **"Run"**
4. Verify: Go to **Table Editor** → `skills` table should have entries

### Step 5: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. (Optional) Configure email templates:
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation email if desired
4. (Optional) Restrict to Northeastern emails:
   - Go to **Authentication** → **Policies**
   - You can add RLS policies to restrict signups to `@northeastern.edu` emails

### Step 6: Set Up Row Level Security (RLS)

The SQL script already includes RLS policies, but verify:
1. Go to **Authentication** → **Policies**
2. Check that all tables have policies enabled
3. Test that users can only access their own data

---

## Part 2: Local Development Setup

### Step 1: Install Dependencies

```bash
cd student-networking-app
npm install
# or
pnpm install
```

### Step 2: Create Environment Variables

1. Create `.env.local` file in the `student-networking-app` directory:

```bash
# Copy from .env.example
cp .env.example .env.local
```

2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Never commit `.env.local`** - it's already in `.gitignore`

### Step 3: Test Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and verify:
- [ ] App loads
- [ ] Can sign up
- [ ] Can log in
- [ ] Can create profile
- [ ] Can browse other profiles

---

## Part 3: Version Control (GitHub)

### Step 1: Initialize Git Repository

```bash
cd student-networking-app
git init
git add .
git commit -m "Initial commit: Team Matching App"
```

### Step 2: Create GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name it: `team-match-app` (or your choice)
3. **Don't** initialize with README (you already have files)
4. Copy the repository URL

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/team-match-app.git
git branch -M main
git push -u origin main
```

---

## Part 4: Vercel Deployment

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login (use GitHub)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository:
   - Find `team-match-app` in the list
   - Click **"Import"**

### Step 2: Configure Project Settings

1. **Project Name**: `team-match-app` (or your choice)
2. **Framework Preset**: Next.js (auto-detected)
3. **Root Directory**: `student-networking-app` (if your repo root is parent)
   - OR leave blank if `student-networking-app` is the repo root
4. **Build Command**: `npm run build` (default)
5. **Output Directory**: `.next` (default)
6. **Install Command**: `npm install` (default)

### Step 3: Add Environment Variables

**Critical Step!** Add these in Vercel:

1. Click **"Environment Variables"**
2. Add each variable:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
```

**Important Notes:**
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be available for **Production**, **Preview**, and **Development**
- `SUPABASE_SERVICE_ROLE_KEY` should **ONLY** be available for **Production** and **Preview** (not Development for security)
- The service role key is used for server-side operations that bypass RLS (team creation, adding members, fetching emails)

3. Make sure to select the appropriate environments for each variable
4. Click **"Save"**

### Step 4: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://team-match-app.vercel.app`

### Step 5: Verify Deployment

1. Visit your Vercel URL
2. Test the app:
   - [ ] Sign up works
   - [ ] Login works
   - [ ] Profile creation works
   - [ ] Database queries work

---

## Part 5: Post-Deployment Configuration

### Step 1: Update Supabase Redirect URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel URLs:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: 
     - `https://your-app.vercel.app/**`
     - `https://your-app.vercel.app/auth/callback`
     - `http://localhost:3000/**` (for local dev)

### Step 2: Set Up Custom Domain (Optional)

1. In Vercel, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `teammatch.northeastern.edu`)
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with new domain

### Step 3: Enable Analytics (Optional)

Vercel Analytics is already in your dependencies. To enable:
1. In Vercel dashboard → **Analytics**
2. Enable **Web Analytics**
3. No code changes needed (already configured)

---

## Part 6: Continuous Deployment

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches (creates preview URLs)

### Manual Deployments

1. Go to Vercel dashboard
2. Click **"Deployments"**
3. Click **"Redeploy"** on any deployment

---

## Part 7: Monitoring & Debugging

### Vercel Logs

1. Go to Vercel dashboard → **Deployments**
2. Click on a deployment
3. Click **"Functions"** tab to see server logs
4. Click **"Logs"** tab for build/runtime logs

### Supabase Logs

1. Go to Supabase dashboard → **Logs**
2. View:
   - **API Logs**: All database queries
   - **Auth Logs**: Authentication events
   - **Postgres Logs**: Database errors

### Common Issues

#### Issue: "Invalid API key"
- **Fix**: Check environment variables in Vercel match Supabase

#### Issue: "CORS error"
- **Fix**: Add Vercel URL to Supabase allowed origins

#### Issue: "Authentication redirect loop"
- **Fix**: Update Supabase redirect URLs (Part 5, Step 1)

#### Issue: "Database query fails"
- **Fix**: Check RLS policies in Supabase → Authentication → Policies

---

## Part 8: Production Checklist

Before sharing with your class:

- [ ] All environment variables set in Vercel
- [ ] Supabase redirect URLs configured
- [ ] Database schema deployed
- [ ] Skills seeded (if using predefined skills)
- [ ] Test signup/login flow
- [ ] Test profile creation
- [ ] Test search/filter functionality
- [ ] Test interest requests
- [ ] Verify RLS policies work correctly
- [ ] Check mobile responsiveness
- [ ] Test on different browsers
- [ ] Set up error monitoring (optional: Sentry)

---

## Part 9: Sharing with Your Class

### Option 1: Share Vercel URL
- Just share: `https://your-app.vercel.app`
- Students can sign up with their Northeastern email

### Option 2: Restrict Access (Optional)
- In Supabase → Authentication → Policies
- Add policy to restrict signups to `@northeastern.edu` emails
- Or use Supabase's email allowlist feature

---

## Part 10: Maintenance

### Updating the App

1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
4. Vercel automatically deploys

### Database Migrations

1. Create new SQL migration file in `scripts/`
2. Run in Supabase SQL Editor
3. Test locally
4. Deploy (Vercel will pick up code changes)

### Backup Database

1. Supabase → Settings → Database
2. Click **"Backups"** (available on paid plans)
3. Or export manually via SQL Editor

---

## 🎉 You're Done!

Your app should now be live at: `https://your-app.vercel.app`

**Next Steps:**
- Share the URL with your class
- Monitor usage in Vercel Analytics
- Collect feedback and iterate

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## 🆘 Need Help?

Common troubleshooting:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Verify environment variables
4. Test locally first
5. Check browser console for errors
