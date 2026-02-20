# Setting Up a New Supabase Project (HuskyTeams)

Use this guide when you've created a **new Supabase account/project** and need to connect the app from scratch.

---

## 1. Create a Supabase project (if you haven’t)

1. Go to [supabase.com](https://supabase.com) and sign in with your new account.
2. **New project** → choose org, name (e.g. `huskyteams`), database password (save it), region.
3. Wait until the project is ready.

---

## 2. Get your project credentials

In the Supabase Dashboard for your project:

### API keys & URL

1. Go to **Settings** (gear) → **API**.
2. Copy:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret; never commit or expose in the browser)

### Database connection (for running migrations)

1. Go to **Settings** → **Database**.
2. Under **Connection string**, choose **URI**.
3. Copy the **Connection string** (non-pooling).
   - Or use **Session mode** and copy that URI.
   - It looks like:  
     `postgres://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`
4. Replace `[YOUR-PASSWORD]` with your **database password** (the one you set when creating the project).

---

## 3. Update `.env.local`

In the project root, edit `student-networking-app/.env.local` (create from `.env.local.example` if needed):

```env
# Replace with YOUR new project values
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your_service_role_key

# Direct DB connection for migrations (replace password and ref)
POSTGRES_URL_NON_POOLING=postgres://postgres.YOUR_PROJECT_REF:YOUR_DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require

# Gmail (for OTP emails) – keep or update
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

- Use the **exact** Project URL and anon/service_role keys from **Settings → API**.
- Use the **exact** connection string from **Settings → Database** (with password filled in) for `POSTGRES_URL_NON_POOLING`.
- If your connection string already has `?sslmode=require`, leave it; otherwise add `?sslmode=require` at the end.

---

## 4. Configure Auth (recommended)

1. **Settings** → **Authentication** → **Providers**  
   - Ensure **Email** is enabled.
2. **Settings** → **Authentication** → **Email Templates**  
   - Optionally customize “Confirm signup” if you use email confirmation.
3. **Settings** → **Authentication** → **URL Configuration**  
   - **Site URL**: `http://localhost:3000` for local dev (or your Vercel URL for production).
   - **Redirect URLs**: add:
     - `http://localhost:3000/**`
     - `http://localhost:3000/onboarding`
     - Your production URL, e.g. `https://your-app.vercel.app/**`
     - `https://your-app.vercel.app/onboarding`

If you want to **require email confirmation** before login:

- **Authentication** → **Providers** → **Email** → enable **“Confirm email”**.

---

## 5. Run database migrations

From the project root (where `package.json` is):

```bash
cd student-networking-app
npm run db:migrate
```

This script reads `.env.local` and runs all SQL migrations in order (tables, RLS, seed data, etc.). You should see something like “All migrations completed” and “Skills seeded successfully”.

If you get “pg not found”:

```bash
npm install pg --save-dev
```

Then run `npm run db:migrate` again.

---

## 6. Verify locally

```bash
npm run dev
```

- Open `http://localhost:3000`.
- Sign up with a new account (use an email you can access if confirmation is on).
- Complete onboarding; you should see skills and be able to create a team.

---

## 7. If you deploy on Vercel

1. In **Vercel** → your project → **Settings** → **Environment Variables**, set:
   - `NEXT_PUBLIC_SUPABASE_URL` = your new Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your new anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = your new service_role key  
   (No need to set `POSTGRES_URL_NON_POOLING` in Vercel; it’s only for running migrations from your machine.)

2. Redeploy (e.g. push to Git or **Redeploy** in Vercel).

3. In Supabase **Authentication** → **URL Configuration**, add your production URL to **Redirect URLs** (as in step 4).

---

## Quick checklist

| Step | What to do |
|------|------------|
| 1 | New Supabase project created |
| 2 | Project URL, anon key, service_role key, and DB connection string copied |
| 3 | `.env.local` updated with new URL, anon key, service_role key, and `POSTGRES_URL_NON_POOLING` |
| 4 | Auth redirect URLs set (localhost + production if applicable) |
| 5 | `npm run db:migrate` run successfully |
| 6 | `npm run dev` works: signup → onboarding → teams |
| 7 | (If deployed) Vercel env vars updated and Supabase redirect URLs include production URL |

After this, the app is fully linked to your new Supabase project.
