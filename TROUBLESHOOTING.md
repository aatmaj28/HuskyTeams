# 🔧 Troubleshooting Guide

Quick fixes for common issues.

## 🚨 Common Errors

### "Invalid API key" or "Supabase client error"

**Cause:** Environment variables not set or incorrect.

**Fix:**
1. Check `.env.local` has correct values
2. In Vercel: Settings → Environment Variables
3. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy after adding variables

---

### "CORS error" or "Blocked by CORS policy"

**Cause:** Vercel URL not in Supabase allowed origins.

**Fix:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Redirect URLs"
3. Add pattern: `https://your-app.vercel.app/**`

---

### "Authentication redirect loop"

**Cause:** Redirect URLs not configured correctly.

**Fix:**
1. Supabase → Authentication → URL Configuration
2. **Site URL:** `https://your-app.vercel.app`
3. **Redirect URLs:** 
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/**` (for dev)

---

### "Row Level Security policy violation"

**Cause:** RLS policies blocking access.

**Fix:**
1. Supabase → Authentication → Policies
2. Check policies are enabled for all tables
3. Verify user is authenticated: `auth.uid() IS NOT NULL`
4. Test with: `SELECT * FROM profiles WHERE id = auth.uid();`

---

### "Table does not exist"

**Cause:** Database schema not created.

**Fix:**
1. Supabase → SQL Editor
2. Run `scripts/001_create_tables.sql`
3. Verify in Table Editor that tables exist

---

### "Build failed" on Vercel

**Cause:** Build errors or missing dependencies.

**Fix:**
1. Check Vercel build logs
2. Test locally: `npm run build`
3. Fix TypeScript errors (or set `ignoreBuildErrors: true` in `next.config.mjs`)
4. Ensure all dependencies in `package.json`

---

### "Module not found" errors

**Cause:** Missing dependencies or incorrect imports.

**Fix:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Check import paths match file structure
4. Verify TypeScript paths in `tsconfig.json`

---

### Database queries return empty results

**Cause:** No data or RLS blocking.

**Fix:**
1. Check data exists: Supabase → Table Editor
2. Verify RLS policies allow SELECT
3. Test query in SQL Editor
4. Check user is authenticated

---

### "Email not sent" or auth emails not working

**Cause:** Email provider not configured.

**Fix:**
1. Supabase → Authentication → Providers
2. Enable Email provider
3. Configure SMTP (or use Supabase default)
4. Check email templates in Authentication → Email Templates

---

## 🔍 Debugging Steps

### 1. Check Logs

**Vercel:**
- Dashboard → Deployments → Click deployment → Logs tab

**Supabase:**
- Dashboard → Logs → API Logs / Auth Logs / Postgres Logs

**Browser:**
- Open DevTools (F12) → Console tab
- Check Network tab for failed requests

### 2. Verify Environment Variables

**Local:**
```bash
# Check .env.local exists and has values
cat .env.local
```

**Vercel:**
- Settings → Environment Variables
- Verify all required vars are set
- Check they're enabled for Production/Preview/Development

### 3. Test Database Connection

**In Supabase SQL Editor:**
```sql
-- Test basic query
SELECT * FROM profiles LIMIT 5;

-- Test RLS
SELECT * FROM profiles WHERE id = auth.uid();
```

### 4. Test Authentication

**Local:**
1. Clear browser cookies
2. Try signup/login
3. Check Supabase → Authentication → Users

**Production:**
1. Check Supabase redirect URLs
2. Verify email confirmation (if enabled)
3. Check auth logs in Supabase

---

## 🛠️ Quick Fixes

### Reset Everything

```bash
# Local
rm -rf node_modules .next
npm install
npm run dev

# Database (careful - deletes all data!)
# In Supabase SQL Editor:
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS interest_requests CASCADE;
-- ... (drop all tables)
-- Then re-run 001_create_tables.sql
```

### Clear Vercel Cache

1. Vercel Dashboard → Deployments
2. Click "..." → "Redeploy"
3. Or delete and re-import project

### Clear Browser Cache

- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear site data in DevTools → Application

---

## 📞 Getting Help

1. **Check logs first** (Vercel + Supabase)
2. **Test locally** - if it works locally but not in production, it's a config issue
3. **Verify environment variables** - most issues are here
4. **Check documentation:**
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)

---

## ✅ Pre-Deployment Checklist

Before deploying, verify:

- [ ] `.env.local` has correct Supabase credentials
- [ ] `npm run build` succeeds locally
- [ ] `npm run dev` works without errors
- [ ] Database schema is created
- [ ] Can sign up and log in locally
- [ ] Environment variables added to Vercel
- [ ] Supabase redirect URLs configured
- [ ] No console errors in browser

---

## 🎯 Still Stuck?

1. **Check the deployment guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Review the checklist:** [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
3. **Common issues:**
   - 90% of issues = wrong environment variables
   - 5% = RLS policies
   - 5% = missing database schema

---

**Last Updated:** [Date]
