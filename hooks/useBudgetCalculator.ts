import { useMemo } from 'react';

type Activity = {
  id: string;
  cost: number;
  [key: string]: any;
};

type Day = {
  date: string;
  activities: Activity[];
  meals?: any[];
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

type Budget = {
  accommodation?: number;
  food?: number;
  activities?: number;
  transport?: number;
  transportation?: number;
  total?: number;
};

type ItineraryWithBudget = {
  days: Day[];
  budget?: Budget;
  budgetEstimate?: Budget;
};

/**
 * Custom hook that normalizes budget data and calculates totals if missing
 * It ensures the budget object has all required properties even if they're missing
 * from the API response or stored data.
 */
export function useBudgetCalculator(itinerary: ItineraryWithBudget | null) {
  return useMemo(() => {
    if (!itinerary) {
      return {
        accommodation: 0,
        food: 0,
        activities: 0,
        transport: 0,
        total: 0,
      };
    }

    // Get budget from itinerary or create empty object - check both budget and budgetEstimate
    const budgetData = itinerary.budget || itinerary.budgetEstimate || {};
    
    // Initialize with defaults
    const normalizedBudget = {
      accommodation: budgetData.accommodation || 0,
      food: budgetData.food || 0,
      transport: budgetData.transport || budgetData.transportation || 0,
      activities: 0, // Will calculate from activities if not provided
      total: 0, // Will be calculated
    };
    
    // If accommodation cost is 0 or not provided, calculate it based on nights not days
    // A 4-day trip has 3 nights, etc.
    if (normalizedBudget.accommodation === 0 && itinerary.days && itinerary.days.length > 0) {
      let totalAccommodationCost = 0;
      const lastDayIndex = itinerary.days.length - 1;
      
      for (let i = 0; i < itinerary.days.length; i++) {
        const day = itinerary.days[i];
        if (i < lastDayIndex && day.accommodation) {
          if (typeof day.accommodation.cost === 'number') {
            totalAccommodationCost += day.accommodation.cost;
          } else if (day.accommodation.cost) {
            const cost = parseFloat(String(day.accommodation.cost));
            if (!isNaN(cost)) {
              totalAccommodationCost += cost;
            }
          }
        }
      }
      
      normalizedBudget.accommodation = totalAccommodationCost;
    }
    
    // Calculate activities cost from actual activities or use provided value
    if (budgetData.activities !== undefined) {
      normalizedBudget.activities = budgetData.activities;
    } else {
      // Sum up all activity costs
      let totalActivitiesCost = 0;
      for (const day of itinerary.days || []) {
        if (day.activities && Array.isArray(day.activities)) {
          for (const activity of day.activities) {
            if (activity && typeof activity.cost === 'number') {
              totalActivitiesCost += activity.cost;
            } else if (activity && activity.cost) {
              // Try to convert to number if it's not already
              const cost = parseFloat(String(activity.cost));
              if (!isNaN(cost)) {
                totalActivitiesCost += cost;
              }
            }
          }
        }
      }
      normalizedBudget.activities = totalActivitiesCost;
    }
    
    // Calculate food costs from meals if not provided
    if (budgetData.food === 0) {
      let totalFoodCost = 0;
      for (const day of itinerary.days || []) {
        if (day.meals && Array.isArray(day.meals)) {
          for (const meal of day.meals) {
            if (meal && typeof meal.cost === 'number') {
              totalFoodCost += meal.cost;
            } else if (meal && meal.cost) {
              const cost = parseFloat(String(meal.cost));
              if (!isNaN(cost)) {
                totalFoodCost += cost;
              }
            }
          }
        }
      }
      normalizedBudget.food = totalFoodCost;
    }
    
    // Calculate transportation costs from transportCost property if not provided
    if (budgetData.transport === 0) {
      let totalTransportCost = 0;
      for (const day of itinerary.days || []) {
        // Add transport costs from activities
        if (day.activities && Array.isArray(day.activities)) {
          for (const activity of day.activities) {
            if (activity && typeof activity.transportCost === 'number') {
              totalTransportCost += activity.transportCost;
            } else if (activity && activity.transportCost) {
              const cost = parseFloat(String(activity.transportCost));
              if (!isNaN(cost)) {
                totalTransportCost += cost;
              }
            }
          }
        }
        
        // Add transport costs from meals
        if (day.meals && Array.isArray(day.meals)) {
          for (const meal of day.meals) {
            if (meal && typeof meal.transportCost === 'number') {
              totalTransportCost += meal.transportCost;
            } else if (meal && meal.transportCost) {
              const cost = parseFloat(String(meal.transportCost));
              if (!isNaN(cost)) {
                totalTransportCost += cost;
              }
            }
          }
        }
      }
      normalizedBudget.transport = totalTransportCost;
    }
    
    // Calculate the total from all components
    normalizedBudget.total = 
      normalizedBudget.accommodation + 
      normalizedBudget.food + 
      normalizedBudget.activities + 
      normalizedBudget.transport;
    
    // If budget.total is provided and is different from calculated total,
    // log a warning but use the calculated value for consistency
    if (budgetData.total !== undefined && budgetData.total !== normalizedBudget.total) {
      console.warn('Provided budget total does not match calculated total. Using calculated total for consistency.');
    }
    
    return normalizedBudget;
  }, [itinerary]);
}

export default useBudgetCalculator; 