import { NextResponse } from 'next/server';
import { generateJobId, processItineraryResponse, processItineraryJob } from '../job-processor';
import { createJob, updateJobStatus, getJobStatus, supabase } from '../../../lib/supabase';
import { createLogger } from '../../../lib/logger';

// Initialize logger
const logger = createLogger('generate-itinerary');

// Configure runtime for serverless function
export const runtime = 'nodejs';
export const maxDuration = 60; // Set max duration to 60 seconds

// Check if Supabase is properly configured
const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Check if OpenAI API key is configured
const isOpenAIConfigured = Boolean(process.env.OPENAI_API_KEY);

// Survey data type
type SurveyData = {
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  budget: string;
  preferences: string[];
};

export async function POST(request: Request) {
  try {
    // Log key information for debugging
    logger.info(`========== ITINERARY GENERATION REQUEST ==========`);
    logger.info(`API Request started: ${new Date().toISOString()}`);
    logger.info('Environment:', {
      nodeEnv: process.env.NODE_ENV,
    });
    
    // Log environment variables (without exposing actual values)
    logger.info('Supabase connection details:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) || 'missing',
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 5) || 'missing',
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
    });

    // Log OpenAI configuration
    logger.info('OpenAI API configuration:', {
      hasApiKey: isOpenAIConfigured,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 5) || 'missing',
      keyLength: process.env.OPENAI_API_KEY?.length || 0
    });

    // Only test Supabase connection if properly configured
    if (isSupabaseConfigured) {
      try {
        logger.info('Testing Supabase connection...');
        const { data, error } = await supabase.from('jobs').select('*').limit(1);
        if (error) {
          logger.error('❌ Supabase connection test failed:', {
            message: error.message,
            hint: error.hint || '',
            code: error.code || ''
          });
        } else {
          logger.info('✅ Supabase connection test successful');
        }
      } catch (connError: any) {
        logger.error('❌ Supabase connection test exception:', {
          message: connError.message,
          details: connError.toString(),
          name: connError.name,
          stack: connError.stack?.substring(0, 200)
        });
      }
    } else {
      logger.warn('⚠️ Skipping Supabase connection test - not configured');
    }

    // Validate OpenAI API key
    if (!isOpenAIConfigured) {
      logger.error('❌ OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse the request body
    const surveyData: SurveyData = await request.json();
    logger.info('Received survey data:', {
      destination: surveyData.destination,
      startDate: surveyData.startDate,
      endDate: surveyData.endDate,
      purpose: surveyData.purpose,
      budget: surveyData.budget,
      preferences: surveyData.preferences 
    });

    // Create a unique job ID - use a consistent format for all environments
    const jobId = generateJobId();
    logger.info(`Generated new job ID: ${jobId}`);

    // Generate the prompt on the server side
    const prompt = generatePrompt(surveyData);
    logger.info(`Generated prompt for job ${jobId}, length: ${prompt.length} characters`);

    // Create a new job in Supabase
    logger.info('Creating new job with ID:', jobId);
    let jobCreated = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    // Add retry logic for job creation
    while (!jobCreated && retryCount < maxRetries) {
      try {
        jobCreated = await createJob(jobId);
        if (!jobCreated) {
          logger.error(`Failed to create job on attempt ${retryCount + 1}/${maxRetries}`);
          retryCount++;
          if (retryCount < maxRetries) {
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount)));
          }
        }
      } catch (error) {
        logger.error(`Error creating job on attempt ${retryCount + 1}/${maxRetries}:`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount)));
        }
      }
    }
    
    if (!jobCreated) {
      logger.error('Failed to create job after multiple attempts');
      return NextResponse.json(
        { error: 'Failed to create job in database after multiple attempts' },
        { status: 500 }
      );
    }
    
    logger.info(`Job ${jobId} created successfully, current status: queued`);

    // Verify the job was created properly by fetching its status
    let statusCheck;
    try {
      statusCheck = await getJobStatus(jobId);
      logger.info(`Initial job status check: ${statusCheck.status}`);
      
      if (statusCheck.status === 'not_found') {
        logger.error(`Critical error: Job ${jobId} was not found immediately after creation`);
        // Try to recreate the job one more time in case of race condition
        jobCreated = await createJob(jobId);
        if (jobCreated) {
          logger.info(`Job ${jobId} recreated successfully after initial not_found status`);
          statusCheck = await getJobStatus(jobId);
          logger.info(`Second job status check: ${statusCheck.status}`);
        }
      }
    } catch (statusCheckError) {
      logger.error('Error checking initial job status:', statusCheckError);
    }

    // Update job to processing state and store the prompt
    await updateJobStatus(jobId, 'processing', { prompt });
    logger.info(`Job ${jobId} status updated to processing with prompt stored`);

    // Process the itinerary job directly (the API call will happen in the background)
    // This allows us to return a response to the client quickly
    processItineraryJob(
      jobId,
      surveyData,
      prompt,
      process.env.OPENAI_API_KEY || ''
    ).then(success => {
      if (success) {
        logger.info(`Background job processing completed successfully for job ${jobId}`);
      } else {
        logger.error(`Background job processing failed for job ${jobId}`);
      }
    }).catch(error => {
      logger.error(`Error in background job processing for job ${jobId}:`, error);
      // Make sure to update the job status even in case of error
      updateJobStatus(jobId, 'failed', { error: error.message || 'Unknown error' })
        .catch(updateErr => logger.error(`Failed to update job status on error: ${updateErr.message}`));
    });

    // Return immediately with the job ID
    logger.info(`Returning response for job ${jobId} with status: processing`);
    return NextResponse.json({ 
      jobId, 
      status: 'processing',
      message: 'Your itinerary is being generated. Poll the job-status endpoint for updates.'
    });
    
  } catch (error: any) {
    logger.error('Error initiating itinerary generation:', error);
    return NextResponse.json(
      { error: `Failed to initiate itinerary generation: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// Function to generate a prompt based on survey data
export function generatePrompt(surveyData: SurveyData): string {
  // Calculate trip duration - adding 1 to include both start and end date
  const startDate = new Date(surveyData.startDate);
  const endDate = new Date(surveyData.endDate);
  
  // Set time to noon to avoid timezone issues
  startDate.setHours(12, 0, 0, 0);
  endDate.setHours(12, 0, 0, 0);
  
  // Calculate number of days
  const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Format dates for display
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  
  // Determine budget guidelines based on selected budget
  let budgetGuidelines = '';
  switch(surveyData.budget.toLowerCase()) {
    case 'budget':
      budgetGuidelines = 'Include hostels, street food, free/low-cost activities';
      break;
    case 'moderate':
      budgetGuidelines = 'Include mid-range hotels, casual restaurants, affordable attractions';
      break;
    case 'luxury':
      budgetGuidelines = 'Include high-end hotels, fine dining, premium experiences';
      break;
    default:
      budgetGuidelines = 'Include a mix of options appropriate for a moderate budget';
  }

  // Construct the prompt with improved flexibility
  return `
Create a travel itinerary for ${surveyData.destination} from ${formattedStartDate} to ${formattedEndDate} (${tripDuration} days).

Tailor this itinerary for the traveler. Their purpose of the trip is ${surveyData.purpose}. Their budget is ${surveyData.budget} (${budgetGuidelines}). ${surveyData.preferences && surveyData.preferences.length > 0 ? `They like ${surveyData.preferences.join(', ')}, so include more of those activities.` : ''}

Return a JSON itinerary with this structure:
{
  "destination": "City, Country",
  "tripName": "Short title",
  "overview": "Brief summary",
  "startDate": "${surveyData.startDate}",
  "endDate": "${surveyData.endDate}",
  "duration": ${tripDuration},
  "travelTips": ["2-4 essential tips for this destination"],
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "accommodation": {
        "name": "Hotel/hostel/rental name",
        "description": "Brief description",
        "cost": number,
        "coordinates": {"lat": number, "lng": number}
      },
      "activities": [
        {
          "time": "Morning/Afternoon/Evening/Night",
          "title": "Activity name",
          "description": "Brief description",
          "cost": number,
          "transportMode": "Walk/Bus/Metro/Taxi/Train",
          "transportCost": number,
          "coordinates": {"lat": number, "lng": number}
        }
      ],
      "meals": [
        {
          "type": "Breakfast/Lunch/Dinner",
          "venue": "Restaurant name",
          "description": "Brief description",
          "cost": number,
          "transportMode": "Walk/Bus/Metro/Taxi/Train",
          "transportCost": number,
          "coordinates": {"lat": number, "lng": number}
        }
      ]
    }
  ]
}

IMPORTANT GUIDELINES:
1. Return only valid JSON
2. All coordinates must be precise numeric values with exactly 6 decimal places for accuracy (e.g., 40.123456, -74.123456)
3. All costs must be numbers
4. Include both activities AND meals in each day:
   - Do NOT put food experiences in the activities array
   - Always include 1-3 meals per day in the meals array
5. Provide precise, real-world locations that exist
6. Activities should make geographic sense (grouped by area when possible)
7. Include accurate transportMode and transportCost for each activity and meal${surveyData.preferences.includes('food') ? '\n8. Since the traveler likes food, emphasize quality dining experiences in the meals section. If an experience involves food next to a meal time, dont add a meal as well' : ''}`;
}

// Helper function to format dates in a nicer way
function formatDate(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  // Add suffix to day
  let suffix = 'th';
  if (day === 1 || day === 21 || day === 31) suffix = 'st';
  else if (day === 2 || day === 22) suffix = 'nd';
  else if (day === 3 || day === 23) suffix = 'rd';
  
  return `${month} ${day}${suffix}, ${year}`;
}