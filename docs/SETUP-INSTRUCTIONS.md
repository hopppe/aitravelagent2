# Authentication Setup Instructions

## Supabase Configuration

To enable user authentication and profile management in the application, follow these steps:

1. Ensure your `.env.local` file has the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   ```

2. The `SUPABASE_SERVICE_KEY` is needed for server-side operations like updating user profiles. To get this key:
   - Log in to your Supabase dashboard
   - Go to Project Settings > API
   - Copy the "service_role" key (keep this secure, as it has admin privileges)

## Authentication Flow

The application now supports:
- Email/password signup and login
- Profile management (updating display name)
- Protected routes that require authentication

## Security Considerations

- The service role key has admin privileges, so it's used only on the server-side API routes
- The client-side code uses the anon key which has limited permissions
- User sessions are managed securely by Supabase

## Testing

To test the authentication system:
1. Visit `/auth` to create a new account or sign in
2. After signing in, you'll be redirected to your profile page
3. Try updating your display name to confirm the profile update functionality works

## Troubleshooting

If you encounter issues with profile updates, check the following:

1. **Display Name Validation**: Names must be strings with a maximum of 255 characters. The application enforces this limit both on the client and server side.

2. **Service Key Issues**: If you see errors like "string did not match the expected pattern" when updating profiles, confirm that:
   - The `SUPABASE_SERVICE_KEY` is correctly set in your `.env.local` file
   - You're using the "service_role" key from Supabase (not the anon key)
   - Your Supabase project is on a plan that supports service role API access

3. **Network Issues**: If profile updates fail, check your browser's developer console for network errors. 