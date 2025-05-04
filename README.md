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
- `lib/supabase.ts`: Supabase client and job management utilities
- `lib/logger.ts`: Structured logging system

## How It Works

1. User submits travel preferences through the UI
2. The frontend calls the `/api/generate-itinerary` endpoint
3. The server creates a job in Supabase and calls the OpenAI API
4. Results are stored in Supabase
5. The frontend polls the `/api/job-status` endpoint to check progress
6. When the job is complete, the frontend displays the generated itinerary

## Setup

### Prerequisites

- Node.js 16+
- Supabase account
- OpenAI API key

### Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### Database Setup

Create a `jobs` table in your Supabase database:

```sql
CREATE TABLE jobs (
  id BIGINT PRIMARY KEY,
  status TEXT,
  result JSONB,
  error TEXT,
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

### Security Best Practices

- API keys are only accessed on the server side through secure API routes
- Client-side code requests data from these server routes without exposing the API keys
- The `.next` build directory is not committed to version control to prevent leaking secrets
- Environment files with real API keys (`.env.local`, `.env.development.local`, etc.) are excluded from Git

## License

MIT 