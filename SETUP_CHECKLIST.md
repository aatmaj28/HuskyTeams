# ✅ Setup Checklist

Use this checklist to track your deployment progress.

## Phase 1: Supabase Setup

- [ ] Create Supabase account
- [ ] Create new project
- [ ] Save project URL and anon key
- [ ] Run `scripts/001_create_tables.sql` in SQL Editor
- [ ] Verify tables created (check Table Editor)
- [ ] Run `scripts/002_seed_skills.sql` (optional)
- [ ] Verify skills populated
- [ ] Check RLS policies are enabled
- [ ] Configure email authentication provider

## Phase 2: Local Development

- [ ] Clone/download project
- [ ] Run `npm install` or `pnpm install`
- [ ] Create `.env.local` file
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Run `npm run dev`
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test profile creation
- [ ] Test search/browse functionality

## Phase 3: Version Control

- [ ] Initialize git repository
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Verify `.env.local` is NOT committed (check .gitignore)

## Phase 4: Vercel Deployment

- [ ] Create Vercel account (via GitHub)
- [ ] Import GitHub repository
- [ ] Configure project settings:
  - [ ] Framework: Next.js
  - [ ] Root directory: `student-networking-app` (if needed)
  - [ ] Build command: `npm run build`
- [ ] Add environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deploy project
- [ ] Get deployment URL

## Phase 5: Post-Deployment

- [ ] Update Supabase redirect URLs:
  - [ ] Add Vercel production URL
  - [ ] Add Vercel preview URL pattern
  - [ ] Keep localhost for development
- [ ] Test production deployment:
  - [ ] Sign up works
  - [ ] Login works
  - [ ] Profile creation works
  - [ ] Database queries work
  - [ ] No CORS errors
- [ ] Test on mobile device
- [ ] Test on different browsers

## Phase 6: Optional Enhancements

- [ ] Set up custom domain
- [ ] Enable Vercel Analytics
- [ ] Configure email templates in Supabase
- [ ] Restrict signups to @northeastern.edu emails
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Add database backups

## Phase 7: Launch

- [ ] Share URL with class
- [ ] Monitor initial usage
- [ ] Collect feedback
- [ ] Plan iterations

---

## 🐛 Troubleshooting Checklist

If something doesn't work:

- [ ] Check Vercel deployment logs
- [ ] Check Supabase logs (API, Auth, Postgres)
- [ ] Verify environment variables match
- [ ] Check browser console for errors
- [ ] Verify RLS policies allow access
- [ ] Test locally first
- [ ] Check Supabase redirect URLs
- [ ] Verify database schema is correct

---

## 📝 Notes

Write down your credentials here (or use a password manager):

**Supabase:**
- Project URL: `___________________________`
- Anon Key: `___________________________`
- Project ID: `___________________________`

**Vercel:**
- Deployment URL: `___________________________`
- Project Name: `___________________________`

**GitHub:**
- Repository URL: `___________________________`

---

**Last Updated:** [Date]
**Status:** [ ] Not Started | [ ] In Progress | [ ] Complete
