// Core types for the travel agent application

// Geolocation types
export interface Coordinates {
  lat: number;
  lng: number;
}

// Activity related types
export interface Activity {
  id: string;
  title: string;
  description: string;
  startTime?: string;
  endTime?: string;
  cost: number;
  transportCost: number;
  coordinates?: Coordinates;
  imageUrl?: string;
}

export interface Meal {
  id: string;
  title: string;
  description: string;
  type: string; // Breakfast/Lunch/Dinner
  startTime?: string;
  endTime?: string;
  cost: number;
  transportCost: number;
  coordinates?: Coordinates;
  imageUrl?: string;
}

export interface Accommodation {
  name: string;
  description: string;
  cost: number;
  coordinates?: Coordinates;
  imageUrl?: string;
  address?: string;
  type?: string;
}

export interface Day {
  date: string;
  description: string;
  activities: Activity[];
  meals: Meal[];
  accommodation: Accommodation;
}

export interface Budget {
  total: number;
  accommodation: number;
  activities: number;
  food: number;
  transportation: number;
  misc: number;
  dailyBreakdown: {
    [date: string]: {
      accommodation: number;
      activities: number;
      food: number;
      transportation: number;
      misc: number;
      total: number;
    }
  }
}

export interface Itinerary {
  destination: string;
  startDate: string;
  endDate: string;
  days: Day[];
  budget?: Budget;
  summary?: string;
}

// Form related types
export interface TripFormData {
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  budget: string;
  preferences: string[];
}

// Job processing types
export interface JobData {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  type: string;
  parameters: any;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}