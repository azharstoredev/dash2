# Deploy Commands for Fly.io

## Set Supabase Environment Variables

Run these commands to set your Supabase credentials:

```bash
flyctl secrets set SUPABASE_URL="https://your-project-ref.supabase.co" -a dash2
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key_here" -a dash2
```

Replace:

- `your-project-ref` with your actual Supabase project reference
- `your_actual_service_role_key_here` with your actual service role key from Supabase Dashboard → Settings → API

## Check current secrets

```bash
flyctl secrets list -a dash2
```

## Deploy after setting secrets

```bash
flyctl deploy -a dash2
```
