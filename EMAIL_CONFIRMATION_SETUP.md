# Email Confirmation Setup Guide

## Issue
Users can log in without confirming their email address, which is a security concern.

## Solution
We've added client-side checks, but you also need to enable email confirmation in Supabase.

## Steps to Enable Email Confirmation in Supabase

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `wptmedheqnukgpyntzte`

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Providers" or "Settings"

3. **Enable Email Confirmation**
   - Find the "Email" provider settings
   - Look for "Confirm email" or "Enable email confirmations" option
   - **Enable it** (toggle it ON)

4. **Configure Email Settings**
   - Make sure "Enable email confirmations" is checked
   - Set "Secure email change" if you want users to confirm email changes
   - Save the changes

5. **Test the Flow**
   - Sign up with a new account
   - Check your email inbox (and spam folder) for the confirmation email
   - Try logging in without confirming - it should now be blocked
   - Confirm the email and try logging in again - it should work

## What We've Added in the Code

1. **Login Page** (`app/login/page.tsx`):
   - Checks `user.email_confirmed_at` after successful login
   - Shows error message if email is not confirmed
   - Prevents access to dashboard

2. **Dashboard Layout** (`app/dashboard/layout.tsx`):
   - Checks `user.email_confirmed_at` on every page load
   - Redirects to login with error message if email is not confirmed

## Important Notes

- **Existing Users**: Users who signed up before enabling email confirmation will need to:
  - Request a new confirmation email, OR
  - You can manually confirm their emails in the Supabase dashboard (Authentication > Users)

- **Email Delivery**: Make sure your Supabase project has email sending configured. By default, Supabase uses their email service, but you can configure custom SMTP if needed.

- **Testing**: After enabling email confirmation, test with a new account to ensure the flow works correctly.

## Troubleshooting

If emails are not being sent:
1. Check Supabase project settings > Authentication > Email Templates
2. Verify your site URL is set correctly in Supabase settings
3. Check spam/junk folders
4. For production, consider setting up custom SMTP (Gmail, SendGrid, etc.)
