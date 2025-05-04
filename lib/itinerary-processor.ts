import { logger } from './logger';

type DayType = {
  date?: string;
  title?: string;
  summary?: string;
  activities?: Array<{
    id?: string;
    time?: string;
    title?: string;
    description?: string;
    location?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    cost?: number;
    image?: string;
    duration?: string;
    transportMode?: string;
    transportCost?: number;
  }>;
  meals?: Array<{
    id?: string;
    type?: string;
    venue?: string;
    description?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    cost?: number;
    transportMode?: string;
    transportCost?: number;
  }>;
  accommodation?: {
    id?: string;
    name?: string;
    description?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    cost?: number;
  };
};

type ProcessedItinerary = {
  id?: string;
  title?: string;
  destination?: string;
  dates?: {
    start?: string;
    end?: string;
  };
  days?: DayType[];
  budget?: {
    accommodation?: number;
    food?: number;
    activities?: number;
    transport?: number;
    total?: number;
  };
  error?: string;
  travelTips?: string[];
};

/**
 * Processes the raw response from OpenAI into a structured itinerary object
 * with validation and normalization of data
 */
export function processRawResponse(rawResponse: string): ProcessedItinerary {
  if (!rawResponse) {
    throw new Error('Received empty response from OpenAI');
  }
  
  // Try to parse the JSON response
  let parsedItinerary: any;
  try {
    // Clean up any potential markdown formatting
    const cleanedResponse = cleanResponse(rawResponse);
    parsedItinerary = JSON.parse(cleanedResponse);
  } catch (error: any) {
    throw new Error(`Failed to parse OpenAI response: ${error.message}`);
  }
  
  // Process and validate the itinerary
  const processedItinerary = validateAndNormalizeItinerary(parsedItinerary);
  
  return processedItinerary;
}

/**
 * Cleans the response string to handle potential formatting issues
 */
function cleanResponse(response: string): string {
  // Remove any potential markdown code block indicators
  let cleaned = response.trim();
  
  // Check if the response is wrapped in code blocks
  if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
    // Remove the first line that might contain "```json"
    cleaned = cleaned.substring(cleaned.indexOf('\n') + 1);
    // Remove the closing code block
    cleaned = cleaned.substring(0, cleaned.lastIndexOf('```'));
    cleaned = cleaned.trim();
  }
  
  // Handle potential JSON with newlines
  return cleaned;
}

/**
 * Validates and normalizes an itinerary object
 */
function validateAndNormalizeItinerary(itinerary: any): ProcessedItinerary {
  if (!itinerary || typeof itinerary !== 'object') {
    throw new Error('Invalid itinerary format: not an object');
  }
  
  // Ensure the itinerary has the expected structure
  const validatedItinerary: ProcessedItinerary = {
    id: itinerary.id || `trip-${Date.now()}`,
    title: itinerary.title || `Trip to ${itinerary.destination || 'Destination'}`,
    destination: itinerary.destination || 'Unknown Destination',
    dates: {
      start: itinerary.dates?.start || new Date().toISOString().split('T')[0],
      end: itinerary.dates?.end
    },
    days: [],
    budget: {
      accommodation: 0,
      food: 0,
      activities: 0,
      transport: 0,
      total: 0
    }
  };
  
  // Process days and activities
  if (Array.isArray(itinerary.days)) {
    for (let i = 0; i < itinerary.days.length; i++) {
      const day = itinerary.days[i];
      if (!day || typeof day !== 'object') continue;
      
      const processedDay: DayType = {
        date: day.date || null,
        title: day.title || null,
        summary: day.summary || null,
        activities: [],
        meals: [],
      };
      
      // Process activities for this day
      if (day.activities && Array.isArray(day.activities)) {
        processedDay.activities = [];
        
        for (let j = 0; j < day.activities.length; j++) {
          const activity = day.activities[j];
          
          if (activity && typeof activity === 'object') {
            // Ensure coordinates are valid
            let coordinates = { lat: 0, lng: 0 };
            if (activity.coordinates && typeof activity.coordinates === 'object') {
              coordinates = {
                lat: parseFloat(String(activity.coordinates.lat)) || 0,
                lng: parseFloat(String(activity.coordinates.lng)) || 0
              };
            }
            
            // Parse cost as number if it's not already
            let cost = 0;
            if (activity.cost !== undefined) {
              cost = typeof activity.cost === 'number' ? 
                activity.cost : 
                parseFloat(String(activity.cost)) || 0;
            }
            
            // Parse transport cost if available
            let transportCost = 0;
            if (activity.transportCost !== undefined) {
              transportCost = typeof activity.transportCost === 'number' ? 
                activity.transportCost : 
                parseFloat(String(activity.transportCost)) || 0;
            }
            
            // Add processed activity to the day
            processedDay.activities.push({
              id: activity.id || `act-${i}-${j}`,
              time: activity.time || '',
              title: activity.title || 'Activity',
              description: activity.description || '',
              location: activity.location || '',
              coordinates,
              duration: activity.duration || '',
              cost,
              transportMode: activity.transportMode || 'Walk',
              transportCost
            });
          }
        }
      }
      
      // Process meals for this day if they exist
      if (day.meals && Array.isArray(day.meals)) {
        processedDay.meals = [];
        
        for (let j = 0; j < day.meals.length; j++) {
          const meal = day.meals[j];
          
          if (meal && typeof meal === 'object') {
            // Ensure coordinates are valid
            let coordinates = { lat: 0, lng: 0 };
            if (meal.coordinates && typeof meal.coordinates === 'object') {
              coordinates = {
                lat: parseFloat(String(meal.coordinates.lat)) || 0,
                lng: parseFloat(String(meal.coordinates.lng)) || 0
              };
            }
            
            // Parse cost as number if it's not already
            let cost = 0;
            if (meal.cost !== undefined) {
              cost = typeof meal.cost === 'number' ? 
                meal.cost : 
                parseFloat(String(meal.cost)) || 0;
            }
            
            // Parse transport cost if available
            let transportCost = 0;
            if (meal.transportCost !== undefined) {
              transportCost = typeof meal.transportCost === 'number' ? 
                meal.transportCost : 
                parseFloat(String(meal.transportCost)) || 0;
            }
            
            // Add processed meal to the day
            processedDay.meals.push({
              id: meal.id || `meal-${i}-${j}`,
              type: meal.type || '',
              venue: meal.venue || '',
              description: meal.description || '',
              coordinates,
              cost,
              transportMode: meal.transportMode || 'Walk',
              transportCost
            });
          }
        }
      }
      
      // Process accommodation for this day
      if (day.accommodation && typeof day.accommodation === 'object') {
        const accommodation = day.accommodation;
        
        // Ensure coordinates are valid
        let coordinates = { lat: 0, lng: 0 };
        if (accommodation.coordinates && typeof accommodation.coordinates === 'object') {
          coordinates = {
            lat: parseFloat(String(accommodation.coordinates.lat)) || 0,
            lng: parseFloat(String(accommodation.coordinates.lng)) || 0
          };
        }
        
        // Parse cost as number if it's not already
        let cost = 0;
        if (accommodation.cost !== undefined) {
          cost = typeof accommodation.cost === 'number' ? 
            accommodation.cost : 
            parseFloat(String(accommodation.cost)) || 0;
        }
        
        // Add processed accommodation to the day
        processedDay.accommodation = {
          id: accommodation.id || `acc-${i}`,
          name: accommodation.name || 'Accommodation',
          description: accommodation.description || '',
          coordinates,
          cost
        };
      }
      
      validatedItinerary.days!.push(processedDay);
    }
  }
  
  // Process budget
  // We will calculate all budget values from individual costs
  let totalAccommodationCost = 0;
  let totalActivitiesCost = 0;
  let totalFoodCost = 0;
  let totalTransportCost = 0;
  
  // Calculate costs from individual items
  if (validatedItinerary.days) {
    // For accommodation, we need to exclude the last day since we're calculating nights, not days
    const lastDayIndex = validatedItinerary.days.length - 1;
    
    for (let i = 0; i < validatedItinerary.days.length; i++) {
      const day = validatedItinerary.days[i];
      
      // Add accommodation costs (only for days except the last one)
      if (day.accommodation && typeof day.accommodation.cost === 'number' && i < lastDayIndex) {
        totalAccommodationCost += day.accommodation.cost;
      }
      
      // Add activity costs
      if (day.activities) {
        for (const activity of day.activities) {
          if (typeof activity.cost === 'number') {
            totalActivitiesCost += activity.cost;
          }
          
          // Add transport costs from activities
          if (typeof activity.transportCost === 'number') {
            totalTransportCost += activity.transportCost;
          }
        }
      }
      
      // Add meal costs and transport costs
      if (day.meals) {
        for (const meal of day.meals) {
          if (typeof meal.cost === 'number') {
            totalFoodCost += meal.cost;
          }
          
          // Add transport costs from meals
          if (typeof meal.transportCost === 'number') {
            totalTransportCost += meal.transportCost;
          }
        }
      }
    }
  }
  
  // Set the budget values
  validatedItinerary.budget = {
    accommodation: totalAccommodationCost,
    food: totalFoodCost,
    activities: totalActivitiesCost,
    transport: totalTransportCost,
    total: totalAccommodationCost + totalFoodCost + totalActivitiesCost + totalTransportCost
  };
  
  return validatedItinerary;
} 