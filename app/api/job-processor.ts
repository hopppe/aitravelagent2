import { updateJobStatus } from '../../lib/supabase';
import { createLogger } from '../../lib/logger';
import { headers } from 'next/headers';

// Create a logger for the job processor
const logger = createLogger('job-processor');

// Helper function to generate a unique job ID
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Function to sanitize JSON - fixes common JSON syntax issues
export function sanitizeJSON(content: string): string {
  logger.debug('Sanitizing JSON content');
  
  // Remove JavaScript-style comments
  let sanitized = content.replace(/\/\/.*?(\r?\n|$)/g, '$1')
                        .replace(/\/\*[\s\S]*?\*\//g, '');
                        
  // Fix property names without quotes
  sanitized = sanitized.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');
  
  // Remove trailing commas
  sanitized = sanitized.replace(/,(\s*[\]\}])/g, '$1');
  
  // Replace single quotes with double quotes
  sanitized = sanitized.replace(/'/g, '"');
  
  return sanitized;
}

// Ensure valid coordinates in the itinerary
export function ensureValidCoordinates(itinerary: any): any {
  logger.debug('Validating and fixing coordinates in itinerary');
  
  // Default backup coordinates for Paris (use as last resort) with 6 decimal places
  const defaultCoordinates = { lat: 48.856614, lng: 2.352222 };
  
  // Helper to validate a single coordinates object
  const isValidCoordinates = (coords: any): boolean => {
    // Check if coordinates exist, are numbers, and have appropriate precision (6 decimal places)
    return coords && 
           typeof coords === 'object' && 
           typeof coords.lat === 'number' && 
           typeof coords.lng === 'number' &&
           !isNaN(coords.lat) && 
           !isNaN(coords.lng);
  };
  
  // Helper to ensure coordinates have 6 decimal places
  const ensureSixDecimalPlaces = (coord: number): number => {
    return parseFloat(coord.toFixed(6));
  };
  
  // If there are no days, nothing to do
  if (!itinerary.days || !Array.isArray(itinerary.days)) {
    logger.warn('No days array found in itinerary');
    return itinerary;
  }
  
  // Track issues found
  let issuesFound = 0;
  
  // Check each day and activity
  itinerary.days.forEach((day: any, dayIndex: number) => {
    // First check accommodation coordinates if they exist
    if (day.accommodation && day.accommodation.coordinates) {
      if (!isValidCoordinates(day.accommodation.coordinates)) {
        issuesFound++;
        logger.warn(`Invalid accommodation coordinates found for day ${dayIndex + 1}`, {
          coordinates: day.accommodation.coordinates,
          dayIndex
        });
        
        // Try to fix coordinates
        if (day.accommodation.coordinates && typeof day.accommodation.coordinates === 'object') {
          // Try to convert string values to numbers
          if (typeof day.accommodation.coordinates.lat === 'string') {
            day.accommodation.coordinates.lat = parseFloat(day.accommodation.coordinates.lat);
          }
          if (typeof day.accommodation.coordinates.lng === 'string') {
            day.accommodation.coordinates.lng = parseFloat(day.accommodation.coordinates.lng);
          }
          
          // If still invalid, use default
          if (!isValidCoordinates(day.accommodation.coordinates)) {
            day.accommodation.coordinates = { ...defaultCoordinates };
          } else {
            // Ensure 6 decimal places
            day.accommodation.coordinates.lat = ensureSixDecimalPlaces(day.accommodation.coordinates.lat);
            day.accommodation.coordinates.lng = ensureSixDecimalPlaces(day.accommodation.coordinates.lng);
          }
        } else {
          day.accommodation.coordinates = { ...defaultCoordinates };
        }
        
        logger.debug(`Fixed accommodation coordinates for day ${dayIndex + 1}`, day.accommodation.coordinates);
      } else {
        // Ensure 6 decimal places even for valid coordinates
        day.accommodation.coordinates.lat = ensureSixDecimalPlaces(day.accommodation.coordinates.lat);
        day.accommodation.coordinates.lng = ensureSixDecimalPlaces(day.accommodation.coordinates.lng);
      }
    }
    
    // Check activities coordinates
    if (!day.activities || !Array.isArray(day.activities)) {
      logger.warn(`Day ${dayIndex + 1} has no activities array`);
      return;
    }
    
    day.activities.forEach((activity: any, activityIndex: number) => {
      // Skip if there's no activity object
      if (!activity || typeof activity !== 'object') {
        logger.warn(`Invalid activity at day ${dayIndex + 1}, index ${activityIndex}`);
        return;
      }
      
      // Check if coordinates exist and are valid
      if (!isValidCoordinates(activity.coordinates)) {
        issuesFound++;
        logger.warn(`Invalid coordinates found for activity "${activity.title}" on day ${dayIndex + 1}`, {
          coordinates: activity.coordinates,
          activityIndex,
          dayIndex
        });
        
        // If the coordinates exist but are invalid, try to fix them
        if (activity.coordinates && typeof activity.coordinates === 'object') {
          // Try to convert string values to numbers
          if (typeof activity.coordinates.lat === 'string') {
            activity.coordinates.lat = parseFloat(activity.coordinates.lat);
          }
          if (typeof activity.coordinates.lng === 'string') {
            activity.coordinates.lng = parseFloat(activity.coordinates.lng);
          }
          
          // If still invalid, use default
          if (!isValidCoordinates(activity.coordinates)) {
            activity.coordinates = { ...defaultCoordinates };
          } else {
            // Ensure 6 decimal places
            activity.coordinates.lat = ensureSixDecimalPlaces(activity.coordinates.lat);
            activity.coordinates.lng = ensureSixDecimalPlaces(activity.coordinates.lng);
          }
        } else {
          // No coordinates or completely invalid, use default
          activity.coordinates = { ...defaultCoordinates };
        }
        
        logger.debug(`Fixed coordinates for activity "${activity.title}"`, activity.coordinates);
      } else {
        // Ensure 6 decimal places even for valid coordinates
        activity.coordinates.lat = ensureSixDecimalPlaces(activity.coordinates.lat);
        activity.coordinates.lng = ensureSixDecimalPlaces(activity.coordinates.lng);
      }
    });
    
    // Check meal coordinates if they exist
    if (day.meals && Array.isArray(day.meals)) {
      day.meals.forEach((meal: any, mealIndex: number) => {
        if (!meal || typeof meal !== 'object') {
          return;
        }
        
        if (!isValidCoordinates(meal.coordinates)) {
          issuesFound++;
          logger.warn(`Invalid coordinates found for meal "${meal.venue || 'unknown'}" on day ${dayIndex + 1}`, {
            coordinates: meal.coordinates,
            mealIndex,
            dayIndex
          });
          
          // Try to fix coordinates
          if (meal.coordinates && typeof meal.coordinates === 'object') {
            // Convert string values to numbers
            if (typeof meal.coordinates.lat === 'string') {
              meal.coordinates.lat = parseFloat(meal.coordinates.lat);
            }
            if (typeof meal.coordinates.lng === 'string') {
              meal.coordinates.lng = parseFloat(meal.coordinates.lng);
            }
            
            // If still invalid, use default
            if (!isValidCoordinates(meal.coordinates)) {
              meal.coordinates = { ...defaultCoordinates };
            } else {
              // Ensure 6 decimal places
              meal.coordinates.lat = ensureSixDecimalPlaces(meal.coordinates.lat);
              meal.coordinates.lng = ensureSixDecimalPlaces(meal.coordinates.lng);
            }
          } else {
            meal.coordinates = { ...defaultCoordinates };
          }
          
          logger.debug(`Fixed coordinates for meal "${meal.venue || 'unknown'}"`, meal.coordinates);
        } else {
          // Ensure 6 decimal places even for valid coordinates
          meal.coordinates.lat = ensureSixDecimalPlaces(meal.coordinates.lat);
          meal.coordinates.lng = ensureSixDecimalPlaces(meal.coordinates.lng);
        }
      });
    }
  });
  
  if (issuesFound > 0) {
    logger.info(`Fixed ${issuesFound} coordinate issues in itinerary`);
  } else {
    logger.debug('All coordinates in itinerary are valid');
  }
  
  return itinerary;
}

// Near the top of the file, add a helper function to detect mobile user agents
function isMobileUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

// Parse and process the OpenAI response from Edge Function
export async function processItineraryResponse(jobId: string, contentData: any): Promise<boolean> {
  try {
    if (!contentData || !contentData.rawContent) {
      await updateJobStatus(jobId, 'failed', { 
        error: 'Invalid response data from API' 
      });
      return false;
    }
    
    let itineraryContent = contentData.rawContent;
    
    // Parse the JSON response with error handling
    try {
      // Try direct parse first
      let itinerary;
      try {
        itinerary = JSON.parse(itineraryContent);
      } catch (err) {
        const parseError = err as Error;
        
        // First try to extract JSON content from the response
        const jsonMatch = itineraryContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            itinerary = JSON.parse(jsonMatch[0]);
          } catch (err2) {
            throw err; // If this fails too, throw the original error
          }
        } else {
          // Try another approach: sanitize and fix common JSON issues
          const sanitizedJSON = sanitizeJSON(itineraryContent);
          try {
            itinerary = JSON.parse(sanitizedJSON);
          } catch (err3) {
            // If all parsing attempts fail, throw with the original error
            throw err;
          }
        }
      }
      
      // Quick validation of the itinerary
      if (!itinerary || typeof itinerary !== 'object') {
        throw new Error('Invalid itinerary structure: not an object');
      }
      
      // Ensure field compatibility with the frontend
      
      // For the original format "overview", make sure "summary" is also available
      if (itinerary.overview && !itinerary.summary) {
        itinerary.summary = itinerary.overview;
      } else if (!itinerary.overview && itinerary.summary) {
        itinerary.overview = itinerary.summary;
      } else if (!itinerary.overview && !itinerary.summary) {
        // Create a default if neither exists
        itinerary.summary = `Travel itinerary for ${itinerary.destination || 'your destination'}`;
        itinerary.overview = itinerary.summary;
      }
      
      // Make sure "tripName" and "title" are both available
      if (itinerary.tripName && !itinerary.title) {
        itinerary.title = itinerary.tripName;
      } else if (!itinerary.tripName && itinerary.title) {
        itinerary.tripName = itinerary.title;
      } else if (!itinerary.tripName && !itinerary.title) {
        // Create a default if neither exists
        itinerary.title = `Trip to ${itinerary.destination || 'Destination'}`;
        itinerary.tripName = itinerary.title;
      }
      
      // Normalize budget information
      if (itinerary.budgetEstimate && !itinerary.budget) {
        itinerary.budget = itinerary.budgetEstimate;
      }
      
      if (itinerary.budget && itinerary.budget.transportation !== undefined && itinerary.budget.transport === undefined) {
        itinerary.budget.transport = itinerary.budget.transportation;
      }
      
      // Ensure "budgetLevel" field for consistency
      if (!itinerary.budgetLevel) {
        // Try to extract from budget string or default to "moderate"
        itinerary.budgetLevel = itinerary.budget && typeof itinerary.budget === 'string' ? 
          itinerary.budget.toLowerCase() : "moderate";
      }
      
      // Frontend expects itinerary.dates.start and itinerary.dates.end
      // But also needs startDate and endDate fields
      if (!itinerary.dates) {
        // Use startDate/endDate from itinerary if available
        const startDate = itinerary.startDate || new Date().toISOString().split('T')[0];
        const endDate = itinerary.endDate || new Date().toISOString().split('T')[0];
        
        itinerary.dates = {
          start: startDate,
          end: endDate
        };
      } else {
        // Ensure startDate and endDate are also available
        if (!itinerary.startDate) itinerary.startDate = itinerary.dates.start;
        if (!itinerary.endDate) itinerary.endDate = itinerary.dates.end;
      }
      
      // Make sure days array exists
      if (!itinerary.days || !Array.isArray(itinerary.days)) {
        logger.warn(`Job ${jobId} missing days array, creating empty array`);
        itinerary.days = [];
      }

      // Fix any missing or invalid coordinates
      ensureValidCoordinates(itinerary);
      
      // Log the processing result for debugging
      logger.info(`Successfully processed itinerary for job ${jobId}, updating job status to completed`);
      
      // Update the job status to completed with the itinerary result
      await updateJobStatus(jobId, 'completed', {
        result: {
          itinerary,
          processed: true
        },
        raw_result: itineraryContent // Store raw content in its own column
      });
      
      return true;
      
    } catch (parseError: any) {
      logger.error(`Failed to parse itinerary JSON for job ${jobId}:`, parseError);
      await updateJobStatus(jobId, 'failed', {
        error: `Failed to parse itinerary JSON: ${parseError.message}`
      });
      return false;
    }
    
  } catch (error: any) {
    logger.error(`Error in itinerary processing for job ${jobId}:`, error);
    await updateJobStatus(jobId, 'failed', {
      error: `Error in itinerary processing: ${error.message}`
    });
    return false;
  }
}

// Process itinerary job by making a direct OpenAI API call
export async function processItineraryJob(
  jobId: string, 
  surveyData: any, 
  promptGenerator: ((surveyData: any) => string) | string,
  apiKey: string
): Promise<boolean> {
  try {
    // Get user agent if available from request header context
    let isMobileRequest = false;
    try {
      const headersList = headers();
      const userAgent = headersList.get('user-agent');
      isMobileRequest = isMobileUserAgent(userAgent);
    } catch (headerError) {
      logger.warn(`Could not access request headers for job ${jobId}: ${headerError}`);
      // Continue without device detection
    }
    
    logger.info(`Processing itinerary job for job ${jobId} in environment: ${process.env.NODE_ENV || 'unknown'}, mobile request: ${isMobileRequest}`);
    
    // Use the provided prompt or generate one using the generator function
    let prompt: string;
    if (typeof promptGenerator === 'function') {
      prompt = promptGenerator(surveyData);
      logger.debug(`Generated prompt for job ${jobId}, length: ${prompt.length} characters`);
    } else {
      prompt = promptGenerator;
      logger.debug(`Using pre-formulated prompt for job ${jobId}, length: ${prompt.length} characters`);
    }
    
    // Estimate completion time based on prompt length
    // Longer prompts mean more complex trips which need more time
    const isComplexTrip = prompt.length > 8000;
    logger.info(`Job ${jobId} complexity assessment: ${isComplexTrip ? 'complex' : 'standard'} trip (${prompt.length} chars)`);
    
    // Update job status to processing if not already
    try {
      await updateJobStatus(jobId, 'processing', { prompt });
      logger.info(`Updated job ${jobId} status to processing`);
    } catch (updateError) {
      logger.warn(`Failed to update job ${jobId} status to processing: ${updateError}`);
      // Continue processing even if we couldn't update status
    }
    
    // Call OpenAI API directly
    logger.info(`Calling OpenAI API for job ${jobId}`);
    
    // Set timeout based on environment, device type, and trip complexity
    const isProduction = process.env.NODE_ENV === 'production';
    let timeoutDuration = 60000; // 60 seconds base timeout
    
    // Adjust timeout based on environment and request type
    if (isProduction) {
      timeoutDuration = 90000; // 90 seconds in production
    }
    
    // Add more time for mobile requests (they tend to be slower)
    if (isMobileRequest) {
      timeoutDuration += 30000; // Additional 30 seconds for mobile
    }
    
    // Add more time for complex trips
    if (isComplexTrip) {
      timeoutDuration += 30000; // Additional 30 seconds for complex trips
    }
    
    logger.info(`Setting API timeout to ${timeoutDuration}ms for job ${jobId}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    try {
      logger.info(`Making OpenAI API request for job ${jobId}, timeout: ${timeoutDuration}ms`);
      const startTime = Date.now();
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo-16k',
          messages: [
            {
              role: 'system',
              content: 'You are an expert travel planner that generates detailed travel itineraries in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 12000,
        }),
        signal: controller.signal
      });
      
      const requestDuration = Date.now() - startTime;
      logger.info(`OpenAI API request completed in ${requestDuration}ms for job ${jobId}`);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`OpenAI API returned error for job ${jobId}: HTTP ${response.status} - ${errorText}`);
        throw new Error(`OpenAI API Error: HTTP ${response.status} - ${errorText}`);
      }
      
      const openAIData = await response.json();
      const rawContent = openAIData.choices[0]?.message?.content;
      
      if (!rawContent) {
        logger.error(`No content in OpenAI response for job ${jobId}`);
        throw new Error('No content in OpenAI response');
      }
      
      // Log a preview of the content (first 100 chars)
      const contentPreview = rawContent.substring(0, 100) + '...';
      logger.info(`Received OpenAI response for job ${jobId}, preview: ${contentPreview}`);
      
      // Process the raw response
      logger.info(`Processing response for job ${jobId}`);
      const processingResult = await processItineraryResponse(jobId, { 
        rawContent, 
        prompt,
        usage: openAIData.usage
      });
      
      if (!processingResult) {
        throw new Error(`Failed to process itinerary response for job ${jobId}`);
      }
      
      logger.info(`Successfully completed job ${jobId}`);
      return true;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle fetch errors
      if (fetchError.name === 'AbortError') {
        logger.error(`OpenAI API call timed out for job ${jobId} after ${timeoutDuration}ms`);
        
        // Determine a more specific message based on device and complexity
        let timeoutMessage = 'API request timed out.';
        if (isMobileRequest && isComplexTrip) {
          timeoutMessage += ' Mobile connections may be slower with complex trips. Please try again with a shorter trip duration or on WiFi.';
        } else if (isMobileRequest) {
          timeoutMessage += ' Mobile connections may be slower. Please try again on WiFi if possible.';
        } else if (isComplexTrip) {
          timeoutMessage += ' Please try again with a shorter trip duration.';
        } else {
          timeoutMessage += ' Please try again.';
        }
        
        // Update job status to indicate timeout specifically
        await updateJobStatus(jobId, 'failed', {
          error: timeoutMessage
        });
        return false;
      }
      
      logger.error(`Fetch error for job ${jobId}:`, fetchError);
      throw fetchError;
    }
  } catch (error: any) {
    logger.error(`Failed to process itinerary job ${jobId}:`, error);
    
    // Determine if this is a network-related error
    const errorMessage = error.message || 'Unknown error';
    const isNetworkError = errorMessage.includes('network') || 
                          errorMessage.includes('ECONNRESET') || 
                          errorMessage.includes('ETIMEDOUT') ||
                          errorMessage.includes('fetch');
    
    // Create user-friendly error message
    let userErrorMessage = `OpenAI API error: ${errorMessage}`;
    if (isNetworkError) {
      userErrorMessage = 'Network connection error. Please check your internet connection and try again.';
    }
    
    // Update job status to failed
    try {
      await updateJobStatus(jobId, 'failed', {
        error: userErrorMessage
      });
      logger.info(`Updated job ${jobId} status to failed`);
    } catch (updateError: any) {
      logger.error(`Failed to update job ${jobId} status to failed: ${updateError}`);
    }
    
    return false;
  }
} 