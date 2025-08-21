# Admin User Management Setup

This document explains how to set up the admin user management system with Supabase.

## Setup Steps

### 1. Supabase Configuration

First, make sure you have Supabase configured in your environment. You need:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### 2. Database Setup

Run the SQL script in your Supabase dashboard:

1. Go to your Supabase dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the script

This will create:

- `admin_users` table with proper structure
- Default admin user with email `admin@azharstore.com` and password `azhar2311`
- Necessary indexes and triggers
- Row Level Security policies

### 3. Default Admin Credentials

After setup, you can login with:

- **Email**: admin@azharstore.com
- **Password**: azhar2311

**Important**: Change the default password immediately after first login!

### 4. Features

The admin user management system provides:

#### Authentication

- Secure password hashing with bcrypt
- Server-side password verification
- Session management

#### Password Management

- Change password functionality
- Current password verification
- Minimum password length validation (6 characters)

#### Email Management

- Update admin email address
- Email validation

#### Fallback Support

- If Supabase is not configured, the system falls back to in-memory storage
- Default credentials work in both modes

## Security Notes

1. **Change Default Password**: Always change the default password in production
2. **Environment Variables**: Keep your Supabase credentials secure
3. **Row Level Security**: The setup includes RLS policies for security
4. **Password Hashing**: All passwords are hashed with bcrypt (salt rounds: 10)

## API Endpoints

The system provides these API endpoints:

- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/change-password` - Change admin password
- `PUT /api/admin/email` - Update admin email
- `GET /api/admin/info` - Get admin information (without password)

## Frontend Components

### Settings Page

- Admin information section shows current email
- Password change form with validation
- Real-time password match validation

### Login Page

- Secure login with password visibility toggle
- Error handling for invalid credentials

### Auth Context

- Centralized authentication state management
- Password change and email update functions
- Admin information caching

## Troubleshooting

### Database Connection Issues

- Check environment variables are set correctly
- Verify Supabase project is active
- The system will fall back to in-memory storage if connection fails

### Login Issues

- Verify the admin user was created successfully
- Check server logs for authentication errors
- Ensure password is at least 6 characters

### Password Change Issues

- Verify current password is correct
- Check password meets minimum length requirement
- Ensure new password and confirmation match

## Development vs Production

### Development

- Can use fallback in-memory storage
- Default credentials are acceptable for testing

### Production

- Must use Supabase for persistence
- Change default password immediately
- Set up proper backup strategies
- Monitor admin user activity
