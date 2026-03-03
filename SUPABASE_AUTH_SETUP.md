# Supabase Authentication Setup Instructions

Follow these steps to enable Google authentication for your Coaching Calculator app.

## Step 1: Enable Google OAuth Provider

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. In the left sidebar, click on **Authentication**
4. Click on **Providers**
5. Find **Google** in the list
6. Toggle **Enable Sign in with Google** to ON
7. You'll see fields for:
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**

## Step 2: Create Google OAuth Credentials

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Select your project (or create a new one)
3. In the search bar, type "OAuth consent screen" and select it
4. Configure the OAuth consent screen:
   - **User Type**: External
   - **App name**: Coaching Calculator
   - **User support email**: seanalex0512@gmail.com
   - **Developer contact**: seanalex0512@gmail.com
   - Click **Save and Continue**
   - **Scopes**: Skip this step, click **Save and Continue**
   - **Test users**: Add seanalex0512@gmail.com, click **Save and Continue**

5. Now go to **Credentials** (left sidebar)
6. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
7. Application type: **Web application**
8. Name: Coaching Calculator
9. **Authorized JavaScript origins**:
   - Add: `https://your-project-ref.supabase.co`
   - Add: `http://localhost:5173` (for local development)
10. **Authorized redirect URIs**:
    - Add: `https://your-project-ref.supabase.co/auth/v1/callback`
    - Add: `http://localhost:5173` (for local development)

    **IMPORTANT**: Replace `your-project-ref` with your actual Supabase project reference

11. Click **CREATE**
12. Copy the **Client ID** and **Client Secret**

## Step 3: Add Credentials to Supabase

1. Go back to Supabase Dashboard → Authentication → Providers → Google
2. Paste the **Client ID** from Google
3. Paste the **Client Secret** from Google
4. In the **Redirect URL** field, you'll see something like:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   Copy this URL - you'll need it for Google Console

5. Click **Save**

## Step 4: Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **+ New query**
3. Copy the contents of `supabase/migrations/005_add_user_authentication.sql`
4. Paste into the SQL editor
5. Click **Run** or press Cmd/Ctrl + Enter
6. You should see: "Success. No rows returned"

## Step 5: Migrate Existing Data

After you successfully log in for the first time:

1. In Supabase Dashboard, go to **SQL Editor**
2. Run this query to assign all existing data to your account:

```sql
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- You can find your user ID in Authentication → Users after logging in

UPDATE students SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE sessions SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE schedule_slots SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
```

To get your user ID:
1. After logging in, go to Supabase Dashboard → Authentication → Users
2. You'll see your email (seanalex0512@gmail.com)
3. Click on it to see the full user ID (UUID format)
4. Copy that ID and replace 'YOUR_USER_ID_HERE' in the SQL above

## Step 6: Update Environment Variables (If Needed)

Make sure your `.env` file has:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Also add these to your Vercel project:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add both variables if not already there

## Step 7: Test the Authentication

1. Open your app at http://localhost:5173
2. You should see the login page
3. Click "Continue with Google"
4. Sign in with seanalex0512@gmail.com
5. You should be redirected to the dashboard

## Step 8: Migrate Your Data

After successful login:
1. Go back to Supabase Dashboard → SQL Editor
2. Go to Authentication → Users and copy your user ID
3. Run the migration query from Step 5 with your actual user ID
4. Refresh your app - you should see all your existing data!

## Troubleshooting

### "Invalid redirect URI"
- Make sure the redirect URI in Google Console exactly matches the one from Supabase
- Check for trailing slashes

### "User not found" or data doesn't appear
- Make sure you ran the migration SQL (Step 5)
- Check that user_id in database matches your user ID from Authentication → Users

### Local development not working
- Make sure you added `http://localhost:5173` to both JavaScript origins and redirect URIs in Google Console

## Security Notes

- Your Google Client Secret is sensitive - never commit it to Git
- Supabase stores it securely in their dashboard
- The anon key is safe to expose (it's client-side)
- RLS policies now protect your data - only you can access your records
