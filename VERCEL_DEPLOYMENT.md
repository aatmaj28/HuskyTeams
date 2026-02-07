# 🚀 Quick Vercel Deployment Guide

## Prerequisites
- ✅ Code is working locally
- ✅ GitHub repository created
- ✅ Supabase project set up

## Quick Steps

### 1. Push to GitHub
```bash
cd student-networking-app
git add .
git commit -m "Ready for deployment"
git push
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your repository
4. Configure:
   - **Root Directory**: Leave blank (or set to `student-networking-app` if repo root is parent)
   - **Framework Preset**: Next.js (auto-detected)

### 3. Add Environment Variables

Click **"Environment Variables"** and add:

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production, Preview only |

**Get these from:** Supabase Dashboard → Settings → API

### 4. Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your app will be live at: `https://your-app.vercel.app`

### 5. Update Supabase Redirect URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/auth/callback`
   - Keep `http://localhost:3000/**` for local dev

### 6. Test

Visit your Vercel URL and test:
- [ ] Sign up with Northeastern email
- [ ] Login
- [ ] Create profile
- [ ] View other profiles
- [ ] Create team
- [ ] Add team members

## Troubleshooting

**Build fails?**
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors

**Authentication not working?**
- Verify Supabase redirect URLs are set
- Check environment variables in Vercel
- Check browser console for errors

**Database errors?**
- Verify RLS policies in Supabase
- Check Supabase logs
- Ensure service role key is set in Vercel

## Next Steps

- Share your Vercel URL with your class
- Monitor usage in Vercel Analytics
- Set up custom domain (optional)
