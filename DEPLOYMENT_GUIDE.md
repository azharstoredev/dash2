
# Deployment Guide

This project is configured for deployment on Railway and Digital Ocean.

## Railway Deployment

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Node.js project
3. Set these environment variables in Railway dashboard:
   - `NODE_ENV=production`
   - `SUPABASE_URL` (if using Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase)
4. Railway will automatically run `npm run build` and `npm start`

## Digital Ocean App Platform

1. Create a new app in Digital Ocean App Platform
2. Connect your GitHub repository
3. Configure build and run commands:
   - Build Command: `npm run build`
   - Run Command: `npm start`
4. Set environment variables:
   - `NODE_ENV=production`
   - `SUPABASE_URL` (if using Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase)

## Environment Variables

Create a `.env.production` file or set these in your deployment platform:

```
NODE_ENV=production
PORT=5000
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Features

- React SPA with routing
- Express API server
- Arabic/English language support
- RTL layout support
- File uploads (stored locally)
- Supabase integration (optional)
