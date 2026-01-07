# OAuth Setup Guide - Google Login

## Current Status

✅ **Google OAuth**: Used as the only third‑party OAuth provider in the app
✅ **Email Magic Link**: Implemented via Supabase `signInWithOtp`

## Google OAuth in ZenHabit AI

The app uses Supabase Auth for Google OAuth. The login button in `Auth.tsx` calls:

- `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`

So the main requirements are:

- Google provider enabled in Supabase
- Valid redirect URI pointing to your Supabase project callback
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` set in env

### Enable Google Provider in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle it **ON**
6. Click **Configure**

### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add **Authorized redirect URIs**:
   ```text
   https://your-project.supabase.co/auth/v1/callback
   ```
   Replace `your-project` with your actual Supabase project reference ID
7. Click **Create**
8. Copy **Client ID** and **Client Secret**

### Add Google Credentials to Supabase

1. In Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Enter:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
3. Click **Save**

## Redirect URI Configuration

### For Development
```text
http://localhost:3000
```

### For Production
```text
https://yourdomain.com
```

### Supabase Callback URL (Required for both)
```text
https://your-project.supabase.co/auth/v1/callback
```

**Important**: Replace `your-project` with your actual Supabase project reference ID (found in your Supabase URL).

## Testing

### Test Google Login
1. Click "Continue with Google"
2. You should be redirected to Google sign‑in
3. After signing in, you should be redirected back to the app (`window.location.origin`)
4. The user should be logged in (Supabase session set, app uses `supabase.auth.getSession()` and `onAuthStateChange`)

### Test Email Magic Link
1. On the login screen, enter an email and click the email primary CTA
2. Supabase sends a magic link using `signInWithOtp`
3. Click the link in the email
4. You should be returned to the app and logged in with the same flow as Google

## Troubleshooting

### Error: "provider is not enabled"
**Solution**: Enable the Google provider in Supabase Dashboard → Authentication → Providers → Google

### Error: "redirect_uri_mismatch"
**Solution**:
- Check redirect URIs in Google app settings
- Ensure Supabase callback URL is added: `https://your-project.supabase.co/auth/v1/callback`
- Ensure your app URL is added: `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)

### Error: "invalid_client"
**Solution**:
- Verify Client ID and Client Secret are correct in Supabase
- Check that credentials are from the correct app/project

### Error: "OAuth flow failed"
**Solution**:
- Check browser console for detailed errors
- Verify redirect URIs match exactly (including http vs https)
- Ensure cookies/third-party cookies are enabled in browser

## Environment Variables

Make sure these are set in `.env.local`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Quick Checklist

- [ ] Google provider enabled in Supabase (optional)
- [ ] Google OAuth credentials added to Supabase (optional)
- [ ] Google redirect URIs configured (optional)
- [ ] Environment variables set
- [ ] Dev server restarted after env changes

## Production Deployment

When deploying to production:

1. **Update Redirect URIs**:
   - Google OAuth: Add production URL
   - Supabase: Already handles both dev and prod

2. **Update Environment Variables**:
   - Use production Supabase project (or same project)
   - Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set

3. **Test OAuth Flow**:
   - Test Google login
   - Verify redirect works correctly
   - Check that user session persists

---

## Current Implementation

The app uses Supabase Auth for OAuth:
- ✅ Real OAuth flow (not mocked)
- ✅ Automatic session management
- ✅ Secure token handling
- ✅ User ID from Supabase Auth

Once providers are enabled in Supabase, the login will work automatically!
