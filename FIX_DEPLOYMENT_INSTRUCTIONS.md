# 🔧 Fix Deployment Issues - Instructions

## Issues Fixed

✅ **Problem 1**: Missing production dependencies (`cors` package)

- Moved `cors` from `devDependencies` to `dependencies` in `package.json`
- Updated Vite server config to properly externalize production dependencies

✅ **Problem 2**: Wrong Docker entry point

- Fixed Dockerfile to use the correct built server file: `dist/server/node-build.mjs`

🔄 **Problem 3**: Missing Supabase environment variables (YOU NEED TO DO THIS)

## Required Actions

### 1. Set Supabase Environment Variables on Fly.io

You need to set your actual Supabase credentials on Fly.io. Run these commands:

```bash
# Replace with your actual Supabase URL and service role key
flyctl secrets set SUPABASE_URL="https://your-project-ref.supabase.co" -a dash2
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="your-actual-service-role-key" -a dash2
```

### 2. Get Your Supabase Credentials

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** → Use as `SUPABASE_URL`
   - **service_role (secret)** → Use as `SUPABASE_SERVICE_ROLE_KEY`

### 3. Deploy the Fixed Version

After setting the environment variables, deploy the updated code:

```bash
flyctl deploy -a dash2
```

## What Was Wrong

1. **Missing Dependencies**: The `cors` package and other production dependencies were in `devDependencies` instead of `dependencies`, causing runtime errors.

2. **Wrong Entry Point**: The Dockerfile was trying to run `dist/server/index.js` instead of the actual built file `dist/server/node-build.mjs`.

3. **No Environment Variables**: Supabase environment variables weren't set on Fly.io, so the app was falling back to in-memory storage.

## Verification

After deployment, check the logs:

```bash
flyctl logs -a dash2
```

You should see:

- ✅ `Supabase client initialized successfully`
- ✅ `Server running on http://0.0.0.0:8080`
- ❌ No more "Cannot find package 'cors'" errors

## Testing Supabase Connection

Once deployed, your app should connect to Supabase properly. You can test by:

1. Creating products/categories in the admin panel
2. Checking if data persists after page refresh
3. No more fallback storage warnings in logs
