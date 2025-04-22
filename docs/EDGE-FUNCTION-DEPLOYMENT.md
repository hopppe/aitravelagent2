# Resolving Edge Function Errors

## Recent Changes to Fix Timeout Issues

We have modified the Edge Function to improve error handling and prevent timeout issues. The key changes include:

1. Increased the timeout configuration from 60 to 120 seconds
2. Increased the max_tokens value to 8000 for more comprehensive itineraries
3. Added better error reporting with phase tracking
4. Implemented request timeouts for the OpenAI API call

## Changes and Optimizations

1. Changed the model from gpt-4o to gpt-3.5-turbo-16k for faster processing and larger context window
2. Set the max_tokens value to 8000
3. Removed unnecessary database connection test
4. Simplified error handling and result processing
5. Improved logging for better debugging

## How to Deploy the Updated Edge Function

To deploy the updated Edge Function, you'll need Docker running:

1. Install Docker Desktop if you don't have it: https://docs.docker.com/desktop/install/
2. Start Docker Desktop
3. Run the deployment command:
   ```
   npm run supabase:deploy-functions
   ```
   
   Or use the Supabase CLI directly:
   ```
   supabase functions deploy generate-itinerary
   ```

## Alternative Manual Update

If you can't run Docker locally, you can manually update the Edge Function:

1. Log in to your Supabase dashboard
2. Navigate to Edge Functions
3. Select the "generate-itinerary" function
4. Copy and paste the updated code from `supabase/functions/generate-itinerary/index.ts`
5. Save the changes

## Troubleshooting Edge Function Errors

The error message `"Edge function invocation error (will retry): Edge Function error: Edge Function returned a non-2xx status code"` typically indicates:

1. **Timeout Issues**: The function took too long to execute (exceeded the timeout)
2. **Memory Limitations**: The function used more memory than allowed
3. **Response Size Limits**: The response payload was too large

Our changes address these issues by:
- Setting a longer timeout (120 seconds)
- Using a different model with larger context window
- Adding better error tracking to identify which phase is failing
- Implementing timeout handling for the OpenAI API call

## Verifying the Deployment

After deployment, test the function with a simple request:

1. Create a new trip with a small set of preferences
2. Check the logs to see detailed error information if it fails again
3. If it continues to fail, check the Supabase Edge Function logs for more details 