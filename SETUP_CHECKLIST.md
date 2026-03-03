# Albis Auth Setup Checklist

## ⚠️ REQUIRED BEFORE USERS CAN SIGN UP

### Step 1: Run SQL in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/wguydvzpxwsgrhvojpnk/sql
2. Open `supabase-setup.sql` in this repo
3. Copy and paste the entire SQL script
4. Click **"Run"**
5. Verify success (should see "Success. No rows returned")

### Step 2: Verify the Setup

Run the test script:
```bash
cd albis-app
node test-supabase-connection.js
```

You should see:
- ✅ Connection successful!
- ✅ Profiles table exists!

### Step 3: Test Signup Flow

1. Start the dev server: `npm run dev`
2. Go to `http://localhost:3000/signup`
3. Create a test account
4. Should redirect to `/onboarding`
5. Complete onboarding
6. Should redirect to `/briefing`

### Step 4: Verify in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/wguydvzpxwsgrhvojpnk/auth/users
2. You should see your test user
3. Go to: https://supabase.com/dashboard/project/wguydvzpxwsgrhvojpnk/editor
4. Select `profiles` table
5. You should see a profile for your test user

## ✅ What's Now Working

- ✅ Real Supabase Auth for signup
- ✅ Real Supabase Auth for login
- ✅ Real Supabase Auth for logout
- ✅ Session persistence (via cookies)
- ✅ Auth state changes reflected in UI
- ✅ Protected routes (e.g., `/briefing` requires login)
- ✅ User menu with email display
- ✅ Automatic profile creation on signup

## 🔒 Security Notes

- Email/password auth is enabled
- Row Level Security (RLS) is enabled on profiles table
- Users can only see/edit their own profile
- Service role key is never exposed to client
- Session tokens are httpOnly cookies

## 📝 Optional: Configure Email Confirmation

If you want to require email confirmation before login:

1. Go to: https://supabase.com/dashboard/project/wguydvzpxwsgrhvojpnk/auth/providers
2. Under "Email" → "Email Settings"
3. Toggle "Confirm email" to ON
4. Configure your email templates

## 🚀 Deployment

When ready to deploy to production:

1. Ensure SQL has been run in production Supabase project
2. Update environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy: `npx vercel --prod`

## 🐛 Troubleshooting

### "Profiles table doesn't exist"
- Run the SQL in `supabase-setup.sql`

### "Could not authenticate"
- Check that your Supabase URL and anon key are correct in `.env.local`
- Make sure you're using the right project

### "Session not persisting"
- Check that middleware is running (should see warning about "middleware" → "proxy")
- Verify cookies are being set in browser DevTools

### "Redirect loop on /briefing"
- Make sure user is actually logged in
- Check Supabase dashboard → Auth → Users
- Try clearing cookies and logging in again

## 📚 Documentation

- Auth implementation: `AUTH_IMPLEMENTATION_SUMMARY.md`
- SQL setup: `supabase-setup.sql`
- Test script: `test-supabase-connection.js`
