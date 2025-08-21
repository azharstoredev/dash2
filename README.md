# E-commerce Dashboard

A production-ready full-stack React application with Express backend.

## Quick Deploy to Heroku

1. **Clone and prepare**:

   ```bash
   git clone <your-repo>
   cd <your-project>
   ```

2. **Deploy to Heroku**:

   ```bash
   # Install Heroku CLI if not installed
   # Create Heroku app
   heroku create your-app-name

   # Deploy
   git push heroku main
   ```

3. **That's it!** Your app will be available at `https://your-app-name.herokuapp.com`

## Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up Supabase (optional)**:
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and service role key from Settings → API
   - Update `.env` file:
     ```env
     SUPABASE_URL=https://your-project-ref.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ```
   - **Note**: Without Supabase, the app uses in-memory storage (data resets on restart)

3. **Start development server**:
   ```bash
   npm run dev
   ```

The app runs on `http://localhost:8080`

## Production Build

```bash
npm run build
npm start
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js
- **UI**: Radix UI components
- **Icons**: Lucide React

## Deployment

The app is configured to deploy easily to:

- ✅ **Heroku** (recommended)
- ✅ **Netlify**
- ✅ **Vercel**
- ✅ **Fly.io**

### Fly.io Deployment

1. **Set up Supabase environment variables**:

   ```bash
   # Set Supabase credentials as Fly secrets (required for database persistence)
   flyctl secrets set SUPABASE_URL=https://your-project-ref.supabase.co
   flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Deploy**:
   ```bash
   flyctl deploy
   ```

**Important**: The variable names must be exactly `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Fly.io to recognize them.

### Build Process

- `npm run build` - Builds the React frontend to `dist/spa/`
- `npm start` - Runs the production server serving static files and API

The production server (`production-server.js`) is optimized for Heroku and handles:

- Static file serving from `dist/spa/`
- API endpoints under `/api/*`
- Client-side routing (SPA)
- Health checks at `/api/ping`
