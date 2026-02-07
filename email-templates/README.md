# Email Template Setup Guide

This guide will help you customize the Supabase authentication email templates for HuskyTeams.

## Files Included

- `confirm-signup.html` - Custom signup confirmation email template

## How to Update Supabase Email Templates

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Confirmation Email Template

1. Click on **"Confirm signup"** template
2. Copy the contents of `confirm-signup.html`
3. Paste it into the template editor
4. **Important:** Make sure to keep the `{{ .ConfirmationURL }}` variable - this is what Supabase uses to insert the confirmation link
5. Click **"Save"**

### Step 3: Test the Email

1. Try signing up with a test email
2. Check your inbox for the new styled email
3. Verify the confirmation link works

## Template Variables

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - The confirmation link URL
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Confirmation token (if needed)
- `{{ .TokenHash }}` - Hashed token (if needed)
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect URL after confirmation

## Customization

You can customize:
- Colors (currently using Northeastern red: #dc2626)
- Course information
- Logo/branding
- Layout and styling

## Notes

- The template uses inline CSS for maximum email client compatibility
- Test in multiple email clients (Gmail, Outlook, Apple Mail)
- Keep the `{{ .ConfirmationURL }}` variable intact for the confirmation link to work
