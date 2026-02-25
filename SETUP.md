# Setup Guide - Phase 2: Supabase Database

This guide will walk you through setting up your Supabase database for the Coaching Calculator app.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: Coaching Calculator (or any name you prefer)
   - **Database Password**: Choose a strong password (save this somewhere safe!)
   - **Region**: Choose the region closest to you
5. Click "Create new project" and wait for it to initialize (this takes 1-2 minutes)

## Step 2: Get Your API Credentials

1. Once your project is ready, go to **Project Settings** (gear icon in the sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Update Your .env File

1. Open the `.env` file in the root of this project
2. Replace the placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://gvajenmokzbmczxtiqcr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_i4PY_ljU1k3YJttCiF8XOw_QGvGd9jg
```

3. Save the file

## Step 4: Create Database Tables

1. In your Supabase dashboard, go to the **SQL Editor** (lightning bolt icon in sidebar)
2. Click **New query**
3. Open the file `supabase/migrations/001_create_tables.sql` from this project
4. Copy all the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" - this is expected!

## Step 5: Verify Tables Were Created

1. Go to **Table Editor** (table icon in sidebar)
2. You should see two tables:
   - `students`
   - `sessions`

## Step 6: Restart Your Dev Server

1. Stop your development server (Ctrl+C in the terminal)
2. Start it again: `npm run dev`
3. The app should now connect to your Supabase database!

## Troubleshooting

**Error: "Missing Supabase environment variables"**
- Make sure your `.env` file has the correct values
- Restart the dev server after updating `.env`

**Tables not showing in Table Editor**
- Check the SQL Editor for any error messages
- Make sure you copied the entire SQL migration file
- Try running the SQL again

**Connection errors**
- Verify your Project URL is correct (should start with `https://`)
- Check that your anon key doesn't have any extra spaces
- Make sure your Supabase project is fully initialized (can take 1-2 minutes)

## What's Next?

After completing these steps, you're ready for **Phase 3: Connect Features to Database**, where we'll:
- Replace mock data with real database queries
- Wire up all the forms to save/update data
- Add real-time data synchronization
