/**
 * Itinerary validation utilities
 * Helper functions to validate and ensure proper itinerary structure
 */

type FormData = {
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  budget: string;
  preferences: string[];
};

type Coordinates = {
  lat: number;
  lng: number;
};

type Activity = {
  title?: string;
  name?: string;
  description?: string;
  cost?: number;
  coordinates?: Coordinates;
  transportMode?: string;
  transportCost?: number;
  [key: string]: any;
};

type Day = {
  day: number;
  date: string;
  activities: Activity[];
  meals: Activity[];
  accommodation?: Activity;
  [key: string]: any;
};

type Itinerary = {
  destination?: string;
  title?: string;
  tripName?: string;
  dates?: {
    start: string;
    end: string;
  };
  days?: Day[];
  [key: string]: any;
};

/**
 * Validates and ensures proper itinerary structure
 * Repairs or adds missing fields when possible
 */
export function validateItineraryStructure(itinerary: any, formData: FormData): Itinerary {
  console.log('Validating itinerary structure');
  
  if (!itinerary || typeof itinerary !== 'object') {
    itinerary = {};
  }
  
  // Add destination if missing
  if (!itinerary.destination) {
    itinerary.destination = formData.destination || 'Unknown';
    console.log('Added missing destination from form data');
  }

  // Ensure dates are proper
  if (!itinerary.dates) {
    itinerary.dates = {
      start: formData.startDate,
      end: formData.endDate
    };
    console.log('Added missing dates from form data');
  }
  
  // Add title if missing
  if (!itinerary.title && !itinerary.tripName) {
    itinerary.title = `Trip to ${itinerary.destination}`;
    itinerary.tripName = itinerary.title;
    console.log('Added missing title');
  } else if (itinerary.title && !itinerary.tripName) {
    itinerary.tripName = itinerary.title;
  } else if (!itinerary.title && itinerary.tripName) {
    itinerary.title = itinerary.tripName;
  }

  // Ensure days array exists and is valid
  if (!itinerary.days || !Array.isArray(itinerary.days)) {
    console.log('Creating basic days structure');
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const tripDuration = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    
    itinerary.days = [];
    for (let i = 0; i < tripDuration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      itinerary.days.push({
        day: i + 1,
        date: currentDate.toISOString().split('T')[0],
        activities: [],
        meals: []
      });
    }
  }

  // Ensure each day has activities array and validate structure
  for (let i = 0; i < itinerary.days.length; i++) {
    const day = itinerary.days[i];
    
    // Check if day has basic required properties
    if (!day || typeof day !== 'object') {
      console.log(`Day ${i+1} is invalid, replacing with default structure`);
      const currentDate = new Date(formData.startDate);
      currentDate.setDate(new Date(formData.startDate).getDate() + i);
      
      itinerary.days[i] = {
        day: i + 1,
        date: currentDate.toISOString().split('T')[0],
        activities: [],
        meals: []
      };
      continue;
    }
    
    // Ensure day number is correct
    day.day = i + 1;
    
    // Fix activities array if missing
    if (!day.activities) {
      day.activities = [];
    } else if (!Array.isArray(day.activities)) {
      console.log(`Day ${i+1} activities is not an array, replacing with empty array`);
      day.activities = [];
    }
    
    // Fix meals array if missing
    if (!day.meals) {
      day.meals = [];
    } else if (!Array.isArray(day.meals)) {
      console.log(`Day ${i+1} meals is not an array, replacing with empty array`);
      day.meals = [];
    }
    
    // Ensure each activity has coordinates and cost
    for (let j = 0; j < day.activities.length; j++) {
      const activity = day.activities[j];
      
      // Skip if activity is not an object
      if (!activity || typeof activity !== 'object') {
        console.log(`Activity ${j+1} on day ${i+1} is invalid, removing`);
        day.activities.splice(j, 1);
        j--;
        continue;
      }
      
      // Ensure name/title exists
      if (!activity.name && !activity.title) {
        if (activity.description) {
          activity.title = activity.description.split('.')[0];
        } else {
          activity.title = `Activity ${j+1}`;
        }
      }
      
      // Ensure coordinates exist
      if (!activity.coordinates) {
        activity.coordinates = { lat: 40.7128, lng: -74.0060 }; // Default NYC coordinates
        console.log(`Added missing coordinates for activity: ${activity.title || activity.name || 'unnamed'}`);
      }
      
      // Ensure cost exists
      if (typeof activity.cost !== 'number') {
        activity.cost = 0;
      }
      
      // Ensure transport data exists
      if (!activity.transportMode) {
        activity.transportMode = 'Walk';
      }
      
      if (typeof activity.transportCost !== 'number') {
        activity.transportCost = 0;
      }
    }
    
    // Do the same for meals
    for (let j = 0; j < day.meals.length; j++) {
      const meal = day.meals[j];
      
      // Skip if meal is not an object
      if (!meal || typeof meal !== 'object') {
        console.log(`Meal ${j+1} on day ${i+1} is invalid, removing`);
        day.meals.splice(j, 1);
        j--;
        continue;
      }
      
      // Ensure name/title exists
      if (!meal.name && !meal.title) {
        meal.title = `Meal ${j+1}`;
      }
      
      // Ensure coordinates exist
      if (!meal.coordinates) {
        meal.coordinates = { lat: 40.7128, lng: -74.0060 }; // Default NYC coordinates
        console.log(`Added missing coordinates for meal: ${meal.title || meal.name || 'unnamed'}`);
      }
      
      // Ensure cost exists
      if (typeof meal.cost !== 'number') {
        meal.cost = 0;
      }
      
      // Ensure transport data exists
      if (!meal.transportMode) {
        meal.transportMode = 'Walk';
      }
      
      if (typeof meal.transportCost !== 'number') {
        meal.transportCost = 0;
      }
    }
  }
  
  console.log('Itinerary validation complete');
  return itinerary as Itinerary;
} 