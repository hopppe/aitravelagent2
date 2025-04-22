'use client';

import React, { useState, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ItineraryMapView from './ItineraryMapView';

// Types imported from other files
type Location = {
  lat: number;
  lng: number;
};

type Activity = {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  coordinates: Location;
  cost: number | string; // Modified to handle both number and string
  image?: string;
};

type Day = {
  date: string;
  activities: Activity[];
};

type Budget = {
  accommodation?: number;
  food?: number;
  activities?: number;
  transport?: number;
  total?: number;
};

interface ItineraryTabsProps {
  days: Day[];
  budget: Budget | undefined;
  title?: string;
  summary?: string;
}

export default function ItineraryTabs({ days, budget = {}, title = '', summary = '' }: ItineraryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };
  
  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Title and Summary */}
      {(title || summary) && (
        <div className="text-center">
          {title && <h1 className="text-3xl font-bold text-primary">{title}</h1>}
          {summary && <p className="text-gray-600 mt-1">{summary}</p>}
        </div>
      )}
      
      {/* Calendar View - Horizontal scrolling days */}
      <div className="relative p-4">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <button 
            onClick={handleScrollLeft}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
            aria-label="Scroll left"
          >
            <FaChevronLeft />
          </button>
        </div>
        
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
          <button 
            onClick={handleScrollRight}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
            aria-label="Scroll right"
          >
            <FaChevronRight />
          </button>
        </div>
        
        <div 
          ref={scrollRef}
          className="overflow-x-auto flex space-x-4 py-2 px-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          style={{ scrollbarWidth: 'thin' }}
        >
          {days.map((day, index) => (
            <DayColumn key={day.date} day={day} index={index} />
          ))}
        </div>
      </div>
      
      {/* Map and Budget widgets - side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Map View */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-80">
            <ItineraryMapView days={days} />
          </div>
        </div>
        
        {/* Budget View */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <BudgetView budget={budget} />
        </div>
      </div>
    </div>
  );
}

// Component for a single day column
function DayColumn({ day, index }: { day: Day, index: number }) {
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  
  const toggleActivity = (id: string) => {
    setExpandedActivity(prev => prev === id ? null : id);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short',
      day: 'numeric' 
    });
  };
  
  // Group activities by time periods (morning, afternoon, evening) for sorting
  const getTimePeriod = (time: string) => {
    const lowerTime = time.toLowerCase();
    
    if (lowerTime.includes('morning') || 
        lowerTime.includes('breakfast') ||
        lowerTime.includes('am') ||
        lowerTime.includes('early')) {
      return 'morning';
    }
    
    if (lowerTime.includes('afternoon') || 
        lowerTime.includes('lunch') ||
        (lowerTime.includes('pm') && lowerTime.includes('12')) ||
        (lowerTime.includes('pm') && lowerTime.includes('1')) ||
        (lowerTime.includes('pm') && lowerTime.includes('2')) ||
        (lowerTime.includes('pm') && lowerTime.includes('3')) ||
        (lowerTime.includes('pm') && lowerTime.includes('4'))) {
      return 'afternoon';
    }
    
    if (lowerTime.includes('evening') || 
        lowerTime.includes('dinner') ||
        lowerTime.includes('night') ||
        (lowerTime.includes('pm') && !lowerTime.includes('12')) ||
        lowerTime.includes('late')) {
      return 'evening';
    }
    
    return 'other';
  };
  
  // Sort activities by their rough time periods
  const sortedActivities = [...day.activities].sort((a, b) => {
    const timePeriods = { 'morning': 0, 'afternoon': 1, 'evening': 2, 'other': 3 };
    const aPeriod = getTimePeriod(a.time);
    const bPeriod = getTimePeriod(b.time);
    
    return timePeriods[aPeriod] - timePeriods[bPeriod];
  });
  
  return (
    <div className="flex-shrink-0 w-72 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      <div className="bg-primary text-white p-2 sticky top-0">
        <h3 className="font-bold">
          Day {index + 1}: {formatDate(day.date)}
        </h3>
      </div>
      
      <div className="max-h-[350px] overflow-y-auto p-3">
        <div className="space-y-2">
          {sortedActivities.map(activity => {
            // Determine color based on activity type
            let bgColor = 'bg-blue-100 border-blue-300'; // Default
            let textColor = 'text-blue-800';
            
            const title = activity.title.toLowerCase();
            if (title.includes('breakfast') || title.includes('lunch') || 
                title.includes('dinner') || title.includes('restaurant') || 
                title.includes('café') || title.includes('cafe') || 
                title.includes('food')) {
              bgColor = 'bg-orange-100 border-orange-300';
              textColor = 'text-orange-800';
            } else if (title.includes('museum') || title.includes('tour') || 
                    title.includes('visit') || title.includes('explore')) {
              bgColor = 'bg-purple-100 border-purple-300';
              textColor = 'text-purple-800';
            } else if (title.includes('hotel') || title.includes('check-in') || 
                    title.includes('check-out') || title.includes('accommodation')) {
              bgColor = 'bg-green-100 border-green-300';
              textColor = 'text-green-800';
            } else if (title.includes('transport') || title.includes('train') || 
                    title.includes('flight') || title.includes('bus') || 
                    title.includes('taxi')) {
              bgColor = 'bg-red-100 border-red-300';
              textColor = 'text-red-800';
            }
            
            return (
              <div
                key={activity.id}
                className={`rounded-lg p-2 border ${bgColor} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => toggleActivity(activity.id)}
              >
                <div className="flex justify-between items-start">
                  <h4 className={`font-medium text-sm ${textColor}`}>{activity.title}</h4>
                  <div className="text-xs font-medium text-primary">
                    ${typeof activity.cost === 'string' 
                      ? parseFloat(activity.cost).toFixed(2) 
                      : activity.cost.toFixed(2)}
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-1 line-clamp-1">
                  {activity.description.length > 60 
                    ? `${activity.description.substring(0, 60)}...` 
                    : activity.description}
                </p>
                <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-200 border-opacity-50">
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-1">📍</span> 
                    <span className="truncate max-w-[90px]">{activity.location}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-1">⏱️</span> {activity.time}
                  </div>
                </div>
                
                {expandedActivity === activity.id && (
                  <div 
                    key={`overlay-${activity.id}`}
                    className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl p-4 w-80"
                  >
                    <h4 className="font-bold mb-2">{activity.title}</h4>
                    <p className="text-sm text-gray-500 mb-1">{activity.time}</p>
                    <p className="text-sm mb-2">{activity.description}</p>
                    <p className="text-sm flex items-center mb-2">
                      <span className="mr-1">📍</span> {activity.location}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      ${typeof activity.cost === 'string' 
                        ? parseFloat(activity.cost).toFixed(2) 
                        : activity.cost.toFixed(2)}
                    </p>
                    <button 
                      className="text-sm text-gray-500 mt-2 w-full bg-gray-100 py-1 rounded hover:bg-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedActivity(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Internal component for budget view
function BudgetView({ budget }: { budget: Budget }) {
  // Default values if budget properties are undefined
  const total = budget?.total || 0;
  const accommodation = budget?.accommodation || 0;
  const food = budget?.food || 0;
  const activities = budget?.activities || 0;
  const transport = budget?.transport || 0;
  
  // Calculate total if not provided but we have component values
  const calculatedTotal = total || (accommodation + food + activities + transport);
  
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-xl font-bold text-primary">${calculatedTotal}</p>
        <p className="text-sm text-gray-500">Total Trip Budget</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-1 border-b text-sm">
          <p className="font-medium">Category</p>
          <p className="font-medium">Amount</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
            <span>Accommodation</span>
          </p>
          <p className="text-sm">${accommodation}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
            <span>Food</span>
          </p>
          <p className="text-sm">${food}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
            <span>Activities</span>
          </p>
          <p className="text-sm">${activities}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            <span>Transportation</span>
          </p>
          <p className="text-sm">${transport}</p>
        </div>
      </div>
      
      <div className="mt-4 pt-2 border-t">
        <div className="w-full h-3 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${calculatedTotal > 0 ? (accommodation / calculatedTotal) * 100 : 0}%` }}
          ></div>
          <div
            className="h-full bg-green-500"
            style={{ width: `${calculatedTotal > 0 ? (food / calculatedTotal) * 100 : 0}%` }}
          ></div>
          <div
            className="h-full bg-yellow-500"
            style={{ width: `${calculatedTotal > 0 ? (activities / calculatedTotal) * 100 : 0}%` }}
          ></div>
          <div
            className="h-full bg-red-500"
            style={{ width: `${calculatedTotal > 0 ? (transport / calculatedTotal) * 100 : 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
} 