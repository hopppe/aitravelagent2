# AI Travel Agent

An AI-powered travel itinerary generator that helps you plan your next trip.


## Architecture

This application uses a serverless architecture with Next.js, Supabase, and OpenAI:

1. **Frontend**: Next.js React application where users submit travel preferences
2. **Backend API**: Next.js API routes that handle job creation, OpenAI API calls, and status checks
3. **Database**: Supabase PostgreSQL database to store jobs and results

### Key Components

- `app/api/generate-itinerary/route.ts`: API endpoint that receives travel survey data and creates jobs
- `app/api/job-status/route.ts`: API endpoint to check job status
- `app/api/job-processor.ts`: Utilities for processing jobs and calling the OpenAI API
- `app/api/places/route.ts`: API endpoint for fetching accommodation options using Google Places API
- `app/api/places/photo/route.ts`: API endpoint for fetching place photos securely
- `lib/supabase.ts`: Supabase client and job management utilities
- `lib/logger.ts`: Structured logging system
- `utils/config.ts`: Server configuration utilities for secure API access

## How It Works

1. User submits travel preferences through the UI
2. The app calls a lightweight server-side API endpoint
3. The server calls OpenAI API securely (protecting API keys)
4. The generated itinerary is displayed immediately in the browser
5. User can optionally save the trip to Supabase for later reference

## API Implementation Approach

The application uses a secure proxy pattern for all API calls:

1. **Route Handler API Routes**: We use Next.js App Router's Route Handlers (app/api/* files) for all external API calls
2. **Server-Side API Key Management**: All API keys are stored as environment variables and accessed only in server-side code
3. **Proxy Pattern for Third-Party APIs**: Client-side code never directly calls external APIs with API keys
4. **Server Config Utility**: The `getServerConfig()` function securely accesses server-side configuration

### Google Places API Implementation

- The application uses Google Places API v1 via secure proxy endpoints
- `app/api/places/route.ts`: Handles accommodation searches with the proper price level filtering
- `app/api/places/photo/route.ts`: Securely proxies photo requests to protect API keys
- `app/api/google-maps/route.ts`: Provides the Maps JavaScript API URL with API key for client usage

### OpenAI API Implementation

- API calls to OpenAI are made server-side only via `app/api/generate-itinerary/route.ts`
- The implementation handles error responses and validates the structure of returned itineraries

## Performance Optimizations

This application is optimized for speed with a streamlined architecture:

1. **Optimized Server-Side Calls**: A lightweight API endpoint handles OpenAI calls securely
2. **No Background Jobs**: The response is processed immediately, without queuing or polling
3. **Client-Side Rendering**: Itinerary is displayed in the browser as soon as it's received
4. **trip is automatically saved**: trip is automatically saved to supabase once the itinerary page is opened
5. **Code Splitting**: Components are lazy-loaded for faster initial page loads

## Setup

### Prerequisites

- Node.js 16+
- Supabase account
- OpenAI API key
- Google Maps API key

### Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### Security Best Practices

- API keys (OpenAI, Google Maps) are only used on the server side
- Secure API endpoints handle sensitive operations via route handlers
- Client-side code never accesses or exposes API keys
- Server runtime configuration is used to manage sensitive keys
- API proxy pattern prevents exposing keys in network requests

### Database Setup

Create the following tables in your Supabase database:

```sql
CREATE TABLE jobs (
  id BIGINT PRIMARY KEY,
  status TEXT,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  trip_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Development

### Testing the Supabase Connection

```bash
npm run test:supabase
```

### Creating a Test Job

```bash
npm run test:mock-job
```

## Troubleshooting

### Job Processing Issues

If jobs get stuck in the "processing" state:

1. Look at the application logs in the `logs/` directory
2. Check if the OpenAI API key is valid

### Database Issues

1. Verify your Supabase credentials in `.env.local`
2. Make sure the `jobs` table exists in your Supabase database
3. Check that the database permissions allow read/write access to the `jobs` table

## Environment Variables and Security

The application uses environment variables to manage sensitive information like API keys. To set up your local environment:

1. Copy `.env.example` to `.env.local`
2. Add your API keys to `.env.local`
3. **IMPORTANT:** Never commit `.env.local` or any files containing API keys to the repository

Environment variables include:

- `GOOGLE_MAPS_API_KEY` - Your Google Maps API key
- `OPENAI_API_KEY` - Your OpenAI API key
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (for admin operations)

### Security Best Practices

- API keys are only accessed on the server side through secure API routes
- Client-side code requests data from these server routes without exposing the API keys
- The `.next` build directory is not committed to version control to prevent leaking secrets
- Environment files with real API keys (`.env.local`, `.env.development.local`, etc.) are excluded from Git

## License

MIT 