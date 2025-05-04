import { updateJobStatus } from '../../lib/supabase';
import { createLogger } from '../../lib/logger';

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

// Parse and process the OpenAI response from Edge Function
export async function processItineraryResponse(jobId: string, contentData: any): Promise<boolean> {
  try {
    if (!contentData || !contentData.rawContent) {
      await updateJobStatus(jobId, 'failed', { 
        error: 'Invalid response data from Supabase edge function' 
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
      
      // Normalize some common field variations
      if (itinerary.budgetEstimate && !itinerary.budget) {
        // Copy budgetEstimate to budget for frontend compatibility
        itinerary.budget = itinerary.budgetEstimate;
      }
      
      if (itinerary.budget && itinerary.budget.transportation !== undefined && itinerary.budget.transport === undefined) {
        // Copy transportation to transport for frontend compatibility
        itinerary.budget.transport = itinerary.budget.transportation;
      }
      
      // Frontend expects itinerary.dates.start and itinerary.dates.end
      if (!itinerary.dates) {
        const today = new Date().toISOString().split('T')[0];
        // Use startDate/endDate from itinerary or create default values to prevent errors
        const startDate = itinerary.startDate || today;
        const endDate = itinerary.endDate || today;
        
        itinerary.dates = {
          start: startDate,
          end: endDate
        };
      }
      
      if (!itinerary.startDate) itinerary.startDate = itinerary.dates.start;
      if (!itinerary.endDate) itinerary.endDate = itinerary.dates.end;
      
      // Copy title from tripName if available
      if (!itinerary.title && itinerary.tripName) {
        itinerary.title = itinerary.tripName;
      } else if (!itinerary.title) {
        // Create a default title
        itinerary.title = `Trip to ${itinerary.destination || 'Destination'}`;
      }
      
      // Copy summary from overview if available
      if (!itinerary.summary && itinerary.overview) {
        itinerary.summary = itinerary.overview;
      } else if (!itinerary.summary) {
        // Create a default summary
        itinerary.summary = `Travel itinerary for ${itinerary.destination || 'your destination'}`;
      }
      
      // Fix any missing or invalid coordinates
      ensureValidCoordinates(itinerary);
      
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
      await updateJobStatus(jobId, 'failed', {
        error: `Failed to parse itinerary JSON: ${parseError.message}`
      });
      return false;
    }
    
  } catch (error: any) {
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
    logger.info(`Processing itinerary job for job ${jobId}`);
    
    // Use the provided prompt or generate one using the generator function
    let prompt: string;
    if (typeof promptGenerator === 'function') {
      prompt = promptGenerator(surveyData);
      logger.debug(`Generated prompt for job ${jobId}, length: ${prompt.length} characters`);
    } else {
      prompt = promptGenerator;
      logger.debug(`Using pre-formulated prompt for job ${jobId}, length: ${prompt.length} characters`);
    }
    
    // Call OpenAI API directly
    logger.info(`Calling OpenAI API for job ${jobId}`);
    // Set a reasonable timeout for the OpenAI call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for longer generations
    
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
            content: 'You are an expert travel planner with deep knowledge of destinations worldwide. Generate a personalized travel itinerary based on the user\'s preferences. Return your response in a structured JSON format only, with no additional text, explanation, or markdown formatting. Do not wrap the JSON in code blocks. Ensure all property names use double quotes. Every activity MUST include high-precision "coordinates" with "lat" and "lng" numerical values with exactly 6 decimal places for accuracy (e.g., 40.123456, -74.123456). For cost fields, use numerical values only without currency symbols. For each activity and meal, include a transportMode (Walk, Bus, Metro, Taxi, Train, etc.) and transportCost (0 for walking, 1-3 for public transport, 10-20 for taxis) appropriate to the location. IMPORTANT: Always separate food experiences (restaurants, cafes, food markets) into the "meals" array and non-food activities (sightseeing, museums, etc.) into the "activities" array. Each day should include at least 1-3 meals in the meals array. Never put food experiences in the activities array. Provide a varied schedule with geographic coherence - activities on a given day should make sense location-wise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 10000
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const openAIData = await response.json();
    const rawContent = openAIData.choices[0].message.content;
    
    // Process the raw response
    await processItineraryResponse(jobId, { 
      rawContent, 
      prompt,
      usage: openAIData.usage
    });
    
    return true;
  } catch (error: any) {
    logger.error(`Failed to process itinerary job ${jobId}:`, error);
    
    // Update job status to failed
    await updateJobStatus(jobId, 'failed', {
      error: `OpenAI API error: ${error.message || 'Unknown error'}`
    });
    
    return false;
  }
} 