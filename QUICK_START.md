# ⚡ Quick Start Guide

Get your app running in 5 minutes!

## 1. Supabase Setup (2 minutes)

1. Go to [supabase.com](https://supabase.com) → Create project
2. Copy your **Project URL** and **anon key** from Settings → API
3. Go to SQL Editor → Run `scripts/001_create_tables.sql`
4. (Optional) Run `scripts/002_seed_skills.sql`

## 2. Local Setup (1 minute)

```bash
cd student-networking-app
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

## 3. Deploy to Vercel (2 minutes)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## 4. Configure Supabase Redirects

In Supabase → Authentication → URL Configuration:
- Add your Vercel URL to redirect URLs

**Done!** 🎉

For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
