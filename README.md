<p align="center">
  <img src="public/favicon.png" alt="HuskyTeams Logo" width="80" height="80">
</p>

<h1 align="center">🐾 HuskyTeams</h1>

<p align="center">
  <strong>Find Your Perfect Project Team at Northeastern University</strong>
</p>

<p align="center">
  <em>Connect with fellow students who have the skills you need. Build amazing projects together with teammates who match your schedule and interests.</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#environment-variables">Environment Variables</a> •
  <a href="#database-setup">Database Setup</a>
</p>

---

## ✨ Features

### 🔍 Smart Discovery
Find students with the exact skills you need using powerful filters and search capabilities.

### 👥 Team Building
Express interest in potential teammates and form balanced project teams with complementary skills.

### 📅 Availability Matching
See when others are free to collaborate and find teammates with compatible schedules.

### 💬 Direct Connection
Reach out to matched students and start collaborating right away.

### 🔐 Secure Email Verification
Custom OTP-based email verification system using Gmail SMTP for secure account creation.

### 🌙 Dark Mode
Beautiful dark-themed UI for comfortable viewing.

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Authentication** | Supabase Auth + Custom OTP |
| **Email Service** | [Nodemailer](https://nodemailer.com/) (Gmail SMTP) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account
- Gmail account with App Password enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aatmaj28/HuskyTeams.git
   cd HuskyTeams
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Copy `.env.local.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.local.example .env.local
   ```

4. **Set up the database**
   
   Run the SQL scripts in your Supabase SQL Editor (see [Database Setup](#database-setup))

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Gmail SMTP (for OTP emails)
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Optional: Development redirect URL
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/onboarding
```

### Getting Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Use this 16-character password in `GMAIL_APP_PASSWORD`

---

## 🗄 Database Setup

Run the following SQL scripts in your Supabase SQL Editor:

### 1. OTP Verifications Table

```sql
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications(email);

-- Enable RLS
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage OTP verifications"
  ON otp_verifications FOR ALL
  USING (auth.role() = 'service_role');
```

### 2. Core Tables

The application requires the following tables:
- `profiles` - User profiles with skills and preferences
- `skills` - Available skills/technologies
- `profile_skills` - User's skills (many-to-many)
- `profile_looking_for` - Skills users are looking for
- `availability` - User availability schedule
- `project_interests` - User's project interests
- `interest_requests` - Team interest requests
- `teams` - Formed teams
- `team_members` - Team membership

---

## 📁 Project Structure

```
student-networking-app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── auth/          # Authentication endpoints
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Login page
│   ├── signup/            # Signup with OTP
│   ├── onboarding/        # User onboarding
│   └── ...
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client
│   └── nodemailer.ts     # Email service
├── public/               # Static assets
└── ...
```

---

## 🔐 Authentication Flow

1. **Sign Up**: User enters email and password
2. **OTP Verification**: 6-digit code sent to email via Gmail SMTP
3. **Account Creation**: After OTP verification, account is created with email pre-confirmed
4. **Onboarding**: User completes profile with skills and availability
5. **Dashboard**: Browse and connect with other students

---

## 🎨 Screenshots

| Landing Page | Dashboard | Profile |
|--------------|-----------|---------|
| Modern landing with stats | Browse students with filters | Complete onboarding profile |

---

## 📜 License

This project is built for **CS5130 40157 Applied Programming & Data Processing for AI** at Northeastern University.

---

## 🙏 Acknowledgments

- [Northeastern University](https://www.northeastern.edu/)
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the backend infrastructure

---

<p align="center">
  Made with ❤️ for Northeastern Huskies 🐾
</p>
