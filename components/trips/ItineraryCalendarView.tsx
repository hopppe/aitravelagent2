import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { FaClock, FaMapMarkerAlt, FaDollarSign, FaInfoCircle, FaChevronDown, FaChevronUp, FaUtensils } from 'react-icons/fa';

// Activity type with all details
type Activity = {
  id?: string;
  time: string;
  title: string;
  description: string;
  location?: string;
  coordinates: { lat: number; lng: number };
  cost: number | string;
  image?: string;
};

// Meal type
type Meal = {
  id?: string;
  type: string;
  venue: string;
  description: string;
  cost: number | string;
  coordinates: { lat: number; lng: number };
};

// Accommodation type
type Accommodation = {
  id?: string;
  name: string;
  description: string;
  cost: number | string;
  coordinates: { lat: number; lng: number };
};

// Common item interface for rendering
type DisplayItem = {
  id?: string;
  time: string;
  title: string;
  description: string;
  location?: string;
  cost: number | string;
  type: string;
};

// Day with activities
type Day = {
  date: string;
  activities: Activity[];
  meals?: Meal[];
  accommodation?: Accommodation;
  title?: string;
  summary?: string;
  dayNumber?: number;
};

// Props for the calendar component
interface ItineraryCalendarViewProps {
  days: Day[];
}

export default function ItineraryCalendarView({ days }: ItineraryCalendarViewProps) {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});

  // Toggle expanded state for a day
  const toggleDay = (dayDate: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayDate]: !prev[dayDate]
    }));
  };

  // Toggle expanded state for an activity
  const toggleActivity = (activityId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  // Format date to display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Determine activity type based on title and description
  const getActivityType = (activity: Activity) => {
    const title = activity.title.toLowerCase();
    const description = activity.description.toLowerCase();
    const time = activity.time.toLowerCase();
    
    // Identify meals
    if (title.includes('breakfast') || 
        title.includes('lunch') || 
        title.includes('dinner') || 
        title.includes('brunch') || 
        title.includes('meal') || 
        title.includes('restaurant') || 
        title.includes('café') || 
        title.includes('cafe') || 
        title.includes('food') ||
        description.includes('breakfast') ||
        description.includes('lunch') ||
        description.includes('dinner') ||
        description.includes('eating') ||
        (time.includes('breakfast')) ||
        (time.includes('lunch')) ||
        (time.includes('dinner'))) {
      return 'meal';
    }
    
    // Identify accommodation
    if (title.includes('hotel') || 
        title.includes('check-in') || 
        title.includes('check-out') || 
        title.includes('accommodation') || 
        title.includes('resort') || 
        title.includes('airbnb') || 
        title.includes('stay') || 
        title.includes('lodging') ||
        description.includes('hotel') ||
        description.includes('accommodation') ||
        description.includes('resort') ||
        description.includes('check-in') ||
        description.includes('check-out')) {
      return 'accommodation';
    }
    
    // Identify transportation
    if (title.includes('transport') || 
        title.includes('train') || 
        title.includes('flight') || 
        title.includes('bus') || 
        title.includes('taxi') ||
        title.includes('drive') ||
        title.includes('transfer') ||
        description.includes('transport') ||
        description.includes('airport') ||
        description.includes('station') ||
        description.includes('terminal')) {
      return 'transport';
    }
    
    // Default to activity
    return 'activity';
  };

  // Get activity icon based on type
  const getItemIcon = (type: string) => {
    switch(type) {
      case 'meal':
        return <span className="text-amber-500">🍽️</span>;
      case 'accommodation':
        return <span className="text-emerald-500">🏠</span>;
      case 'transport':
        return <span className="text-red-500">🚌</span>;
      default:
        return <span className="text-blue-500">🏛️</span>;
    }
  };

  // Get activity colors based on type
  const getItemColors = (type: string) => {
    switch(type) {
      case 'meal':
        return 'bg-amber-100 text-amber-800';
      case 'accommodation':
        return 'bg-emerald-100 text-emerald-800';
      case 'transport':
        return 'bg-red-100 text-red-800';
      default: // activities
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Render activity cost
  const renderCost = (cost: number | string) => {
    // Convert string costs to numbers if possible
    const numericCost = typeof cost === 'string' 
      ? isNaN(parseFloat(cost)) ? 0 : parseFloat(cost)
      : cost;
    
    // Display "Free" for zero cost
    if (numericCost === 0) {
      return <span className="text-green-600 font-medium">Free</span>;
    }
    
    return <span className="text-primary">${numericCost.toFixed(2)}</span>;
  };

  // Get all items for a day (activities, meals, accommodation)
  const getAllDayItems = (day: Day): DisplayItem[] => {
    const items: DisplayItem[] = [];
    
    // Add activities
    if (day.activities && day.activities.length > 0) {
      items.push(...day.activities.map(activity => ({
        id: activity.id || `activity-${Math.random().toString(36).substr(2, 9)}`,
        time: activity.time || '',
        title: activity.title || '',
        description: activity.description || '',
        location: activity.location || '',
        cost: activity.cost || 0,
        type: 'activity'
      })));
    }
    
    // Add meals
    if (day.meals && day.meals.length > 0) {
      items.push(...day.meals.map(meal => ({
        id: meal.id || `meal-${Math.random().toString(36).substr(2, 9)}`,
        time: meal.type || '',
        title: meal.venue || '',
        description: meal.description || '',
        location: meal.venue || '',
        cost: meal.cost || 0,
        type: 'meal'
      })));
    }
    
    // Add accommodation
    if (day.accommodation) {
      const acc = day.accommodation;
      items.push({
        id: `accommodation-${Math.random().toString(36).substr(2, 9)}`,
        time: 'Night',
        title: acc.name || 'Accommodation',
        description: acc.description || '',
        location: acc.name || '',
        cost: acc.cost || 0,
        type: 'accommodation'
      });
    }
    
    // Sort all items by time of day
    return items.sort((a, b) => {
      const timePeriods: Record<string, number> = { 
        'morning': 0, 
        'breakfast': 1, 
        'lunch': 2, 
        'afternoon': 3, 
        'dinner': 4, 
        'evening': 5, 
        'night': 6, 
        'other': 7 
      };
      
      const aTime = (a.time || '').toLowerCase();
      const bTime = (b.time || '').toLowerCase();
      
      let aPeriod = 'other';
      let bPeriod = 'other';
      
      for (const period in timePeriods) {
        if (aTime.includes(period)) {
          aPeriod = period;
          break;
        }
      }
      
      for (const period in timePeriods) {
        if (bTime.includes(period)) {
          bPeriod = period;
          break;
        }
      }
      
      return timePeriods[aPeriod] - timePeriods[bPeriod];
    });
  };

  // Group activities by day
  const groupActivitiesByDay = (days: Day[]) => {
    return days.map((day, index) => {
      return {
        ...day,
        dayNumber: index + 1,
        allItems: getAllDayItems(day)
      };
    });
  };

  const organizedDays = groupActivitiesByDay(days);

  return (
    <div className="space-y-4">
      {/* Summary view: all days in compact form */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Trip Overview</h2>
        <div className="grid grid-cols-1 gap-2">
          {organizedDays.map((day) => (
            <div 
              key={day.date} 
              className="border border-gray-200 rounded p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleDay(day.date)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Day {day.dayNumber}: {formatDate(day.date)}</h3>
                  {day.title && <p className="text-xs text-gray-600">{day.title}</p>}
                  <div className="text-sm text-gray-500 mt-1">
                    {day.allItems.length} items planned
                  </div>
                </div>
                <div>
                  {expandedDays[day.date] ? 
                    <FaChevronUp className="text-gray-400" /> : 
                    <FaChevronDown className="text-gray-400" />
                  }
                </div>
              </div>
              
              {/* Expanded day view */}
              {expandedDays[day.date] && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="space-y-3">
                    {day.allItems.map((item) => (
                      <div 
                        key={item.id}
                        className={`hover:bg-gray-100 p-2 rounded transition-colors cursor-pointer ${getItemColors(item.type)}`}
                        onClick={(e) => toggleActivity(item.id || '', e)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start">
                            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center mr-2 mt-1">
                              {getItemIcon(item.type)}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <span className="font-medium text-xs bg-white bg-opacity-60 text-gray-700 px-2 py-0.5 rounded mr-2">
                                  {item.time}
                                </span>
                                <h4 className="font-medium">{item.title}</h4>
                              </div>
                              
                              {!expandedActivities[item.id || ''] && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium">
                              {renderCost(item.cost)}
                            </div>
                            {expandedActivities[item.id || ''] ? 
                              <FaChevronUp className="text-gray-400" size={12} /> : 
                              <FaChevronDown className="text-gray-400" size={12} />
                            }
                          </div>
                        </div>
                        
                        {/* Expanded activity details */}
                        {expandedActivities[item.id || ''] && (
                          <div className="mt-2 pl-8">
                            <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                            {item.location && (
                              <div className="text-sm text-gray-600 flex items-start mb-1">
                                <FaMapMarkerAlt className="mr-2 mt-1 flex-shrink-0" size={14} />
                                <span>{item.location}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 