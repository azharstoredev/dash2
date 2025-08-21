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

```bash
npm install
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

### Build Process

- `npm run build` - Builds the React frontend to `dist/spa/`
- `npm start` - Runs the production server serving static files and API

The production server (`production-server.js`) is optimized for Heroku and handles:

- Static file serving from `dist/spa/`
- API endpoints under `/api/*`
- Client-side routing (SPA)
- Health checks at `/api/ping`
