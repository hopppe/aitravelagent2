'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaTimes, FaEdit } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import ItineraryMapView from './ItineraryMapView';
import EditItemModal from './EditItemModal';

// Add animation keyframes for scale in animation
const scaleInKeyframes = `
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-scaleIn {
    animation: scaleIn 0.2s ease-out forwards;
  }
`;

// Types imported from other files
type Location = {
  lat: number;
  lng: number;
};

type BaseItem = {
  id?: string;
  time: string;
  title: string;
  description: string;
  location?: string;
  coordinates: Location;
  cost: number | string;
  type: string;
  transportMode?: string;
  transportCost?: number | string;
};

type Activity = {
  id?: string;
  time: string;
  title: string;
  description: string;
  location?: string;
  coordinates: Location;
  cost: number | string;
  image?: string;
  transportMode?: string;
  transportCost?: number | string;
};

type Meal = {
  id?: string;
  type: string;
  venue: string;
  description: string;
  cost: number | string;
  coordinates: Location;
  transportMode?: string;
  transportCost?: number | string;
};

type Accommodation = {
  id?: string;
  name: string;
  description: string;
  cost: number | string;
  coordinates: Location;
  checkInOut?: 'check-in' | 'check-out' | 'staying';
  type?: string;
};

type Day = {
  date: string;
  activities: Activity[];
  meals?: Meal[];
  accommodation?: Accommodation;
  title?: string;
  summary?: string;
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
  travelTips?: string[];
  tripId?: string;
  updateItinerary?: (updatedItinerary: any) => void;
}

// Helper function to create a Google Maps link
const createGoogleMapsLink = (coordinates: Location, title: string, location?: string) => {
  if (!coordinates || !coordinates.lat || !coordinates.lng) return '';
  
  // Use location name if available, otherwise fall back to title
  const placeName = location || title;
  
  // If we have valid coordinates, create a search URL that includes both coordinates and place name
  // This increases the chances that Google Maps will find the exact location
  return `https://www.google.com/maps/search/${encodeURIComponent(placeName)}/@${coordinates.lat},${coordinates.lng},17z`;
};

// Get color scheme based on item type
const getItemColors = (type: string) => {
  switch(type) {
    case 'meal':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        icon: '🍽️'
      };
    case 'accommodation':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        icon: '🏨'
      };
    case 'transport':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: '🚌'
      };
    default: // activities
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: '🗺️'
      };
  }
};

export default function ItineraryTabs({ days, budget = {}, title = '', summary = '', travelTips = [], tripId = '', updateItinerary }: ItineraryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  
  // Track the active popup item across all days
  const [activePopup, setActivePopup] = useState<{
    item: BaseItem; 
    columnId: number;
    position: { x: number; y: number };
  } | null>(null);

  // New state for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<BaseItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  
  // Convert from useMemo to useState to make it mutable
  const initialProcessedDays = useMemo(() => {
    // Make a deep copy of days to avoid mutating the original
    const newDays = JSON.parse(JSON.stringify(days));
    
    // Track if accommodation has been shown
    let lastAccommodation: string | null = null;
    
    // Process each day
    newDays.forEach((day: Day, index: number) => {
      // Skip if no accommodation
      if (!day.accommodation) return;
      
      // If this accommodation is the same as previous one, remove it
      if (lastAccommodation === day.accommodation.name) {
        day.accommodation = undefined;
      } else {
        // Update the last accommodation
        lastAccommodation = day.accommodation.name;
        
        // If this is a multi-day stay, enhance the description
        if (index < newDays.length - 1 && 
            newDays[index + 1].accommodation &&
            newDays[index + 1].accommodation.name === day.accommodation.name) {
          const nextDayWithDiffAccommodation = newDays.findIndex((d: Day, i: number) => 
            i > index && (!d.accommodation || d.accommodation.name !== day.accommodation?.name)
          );
          
          const stayDuration = nextDayWithDiffAccommodation > index 
            ? nextDayWithDiffAccommodation - index 
            : newDays.length - index;
          
          if (stayDuration > 1) {
            day.accommodation.description = 
              (day.accommodation.description || '') + 
              `\n(${stayDuration}-night stay)`;
          }
        }
      }
    });
    
    return newDays;
  }, [days]);
  
  const [processedDays, setProcessedDays] = useState<Day[]>(initialProcessedDays);
  
  // Update processed days when days prop changes
  useEffect(() => {
    setProcessedDays(initialProcessedDays);
  }, [initialProcessedDays]);
  
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
  
  // Check if scrolling is necessary based on content width vs container width
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        const isOverflowing = scrollRef.current.scrollWidth > scrollRef.current.clientWidth;
        setShowNavigation(isOverflowing);
      }
    };

    // Initial check
    checkOverflow();
    
    // Add resize listener to recheck on window size changes
    window.addEventListener('resize', checkOverflow);
    
    // Clean up
    return () => window.removeEventListener('resize', checkOverflow);
  }, [processedDays]);
  
  // Handle edit button click
  const handleEditClick = (item: BaseItem, dayIndex: number) => {
    setCurrentEditItem(item);
    setEditingDayIndex(dayIndex);
    setEditError(null);
    setIsEditModalOpen(true);
  };
  
  // Submit edit request
  const handleEditSubmit = async (feedback: string) => {
    if (!currentEditItem || editingDayIndex === null) {
      setEditError('Missing information to complete the edit');
      return;
    }
    
    if (!tripId) {
      setEditError('Cannot edit items in demo or unsaved trips. Please save the trip first.');
      return;
    }
    
    setIsEditing(true);
    setEditError(null);
    
    try {
      // Determine the item type
      let itemType = 'activity';
      let itemTitle = '';
      
      if ('venue' in currentEditItem || 'type' in currentEditItem && typeof currentEditItem.type === 'string' && 
          ['breakfast', 'lunch', 'dinner', 'brunch'].includes(currentEditItem.type.toLowerCase())) {
        itemType = 'meal';
        // For meals, use venue/title/type as the identifier
        itemTitle = (currentEditItem as any).venue || (currentEditItem as any).title || currentEditItem.type;
      } else if ('name' in currentEditItem && !('time' in currentEditItem)) {
        itemType = 'accommodation';
        // For accommodations, use name as the identifier
        itemTitle = (currentEditItem as any).name;
      } else {
        // For activities, use title as the identifier
        itemTitle = currentEditItem.title;
      }
      
      // Get the day information from the processedDays array
      const dayData = processedDays[editingDayIndex];
      const dayNumber = (dayData as any).day || (editingDayIndex + 1);
      
      console.log('Sending edit request for:', {
        itemTitle,
        itemType,
        dayIndex: editingDayIndex,
        dayNumber,
        feedbackLength: feedback.length
      });
      
      // Call the API to edit the item
      const response = await fetch('/api/edit-itinerary-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId,
          itemId: itemTitle, // Use the title as the identifier
          itemType,
          dayIndex: editingDayIndex, // This is the zero-based index in the days array
          userFeedback: feedback || '' // Ensure feedback is never undefined
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(data.error || 'Failed to edit item');
      }
      
      if (!data.success || !data.editedItem) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response from server');
      }
      
      console.log('Successfully edited item:', data.editedItem);
      
      // Update the itinerary in localStorage
      try {
        const localItinerary = localStorage.getItem('generatedItinerary');
        if (localItinerary) {
          const parsedItinerary = JSON.parse(localItinerary);
          
          // Update the appropriate item in the itinerary based on itemType
          if (itemType === 'meal' && parsedItinerary.days[editingDayIndex].meals) {
            // Find and replace the meal in the day's meals array
            const mealIndex = parsedItinerary.days[editingDayIndex].meals.findIndex(
              (meal: any) => (meal.venue === itemTitle || meal.title === itemTitle || meal.type === itemTitle)
            );
            
            if (mealIndex !== -1) {
              parsedItinerary.days[editingDayIndex].meals[mealIndex] = data.editedItem;
            }
          } else if (itemType === 'accommodation') {
            // Replace the accommodation for this day
            parsedItinerary.days[editingDayIndex].accommodation = data.editedItem;
          } else {
            // Find and replace the activity in the day's activities array
            const activityIndex = parsedItinerary.days[editingDayIndex].activities.findIndex(
              (activity: any) => activity.title === itemTitle
            );
            
            if (activityIndex !== -1) {
              parsedItinerary.days[editingDayIndex].activities[activityIndex] = data.editedItem;
            }
          }
          
          // Save updated itinerary back to localStorage
          localStorage.setItem('generatedItinerary', JSON.stringify(parsedItinerary));
          
          // If updateItinerary prop is provided, use it to update parent component directly
          if (updateItinerary) {
            console.log('Using updateItinerary prop to update parent component');
            updateItinerary(parsedItinerary);
          } else {
            // Otherwise, use custom event as fallback
            window.dispatchEvent(new CustomEvent('itinerary-updated', { detail: parsedItinerary }));
          }
        }
      } catch (storageError) {
        console.error('Error updating localStorage:', storageError);
      }
      
      // Close the modal and refresh the page
      setIsEditModalOpen(false);
      
      // Instead of full page reload, we'll trigger a controlled re-render
      // Refresh the data by reloading it from localStorage
      const updatedItinerary = localStorage.getItem('generatedItinerary');
      if (updatedItinerary) {
        // Force re-render by adding a timestamp to processed days
        const parsedItinerary = JSON.parse(updatedItinerary);
        const newProcessedDays = parsedItinerary.days.map((day: any) => ({
          ...day, 
          _timestamp: Date.now()
        }));
        
        // Replace the days array in the processedDays state
        setProcessedDays(newProcessedDays);
      }
      
    } catch (error: any) {
      console.error('Error editing item:', error);
      setEditError(error.message || 'Failed to edit item');
    } finally {
      setIsEditing(false);
    }
  };

  const handleClosePopup = () => {
    setActivePopup(null);
  };
  
  const renderPopup = () => {
    if (!activePopup) return null;
    
    const { item, columnId, position } = activePopup;
    
    return createPortal(
      <ItemDetailPopup 
        item={item}
        position={position}
        onClose={handleClosePopup}
        createGoogleMapsLink={createGoogleMapsLink}
        onEditClick={(item) => {
          handleClosePopup();
          handleEditClick(item, columnId);
        }}
      />,
      document.body
    );
  };
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scaleInKeyframes }} />
      <div className="w-full">
        {/* Title and Summary - visible in both screen and print */}
        <div className="text-center trip-header">
          {title && <h1 className="text-3xl font-bold text-primary trip-title">{title}</h1>}
          {summary && <p className="text-gray-600 mt-1 trip-summary">{summary}</p>}
        </div>
        
        {/* Calendar View - Horizontal scrolling days */}
        <div className="relative p-4 itinerary-days-view">
          {showNavigation && (
            <>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 print:hidden">
                <button 
                  onClick={handleScrollLeft}
                  className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                  aria-label="Scroll left"
                >
                  <FaChevronLeft />
                </button>
              </div>
              
              <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 print:hidden">
                <button 
                  onClick={handleScrollRight}
                  className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                  aria-label="Scroll right"
                >
                  <FaChevronRight />
                </button>
              </div>
            </>
          )}
          
          <div 
            ref={scrollRef}
            className={`overflow-x-auto flex py-2 px-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent print:block print:overflow-visible print:px-0 print:w-full ${!showNavigation ? 'justify-center' : 'space-x-4'}`}
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="flex space-x-4 px-4 pb-4 pt-2 days-container print:block print:w-full print:space-x-0 print:px-0">
              {processedDays.map((day: Day, index: number) => (
                <DayColumn 
                  key={`day-${index}`}
                  day={day}
                  index={index}
                  onSelectItem={(item, event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const position = {
                      x: Math.min(rect.right + 10, window.innerWidth - 300), // Ensure it's not cut off the screen
                      y: rect.top + window.scrollY
                    };
                    
                    setActivePopup({
                      item,
                      columnId: index,
                      position
                    });
                  }}
                  isActive={(item) => activePopup ? activePopup.item.id === item.id : false}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Map and Budget widgets - side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Map View */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden map-container" style={{ height: '400px' }}>
            <div className="h-full">
              <ItineraryMapView days={days} />
            </div>
          </div>
          
          {/* Budget Breakdown */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-primary text-white p-2 py-3">
              <h2 className="text-xl font-bold">Budget Breakdown</h2>
            </div>
            <div className="p-4">
              <BudgetView budget={budget} />
            </div>
          </div>
        </div>
        
        {/* Travel Tips Section */}
        {travelTips && travelTips.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 travel-tips mt-6">
            <h3 className="text-xl font-bold text-primary mb-4">Travel Tips</h3>
            <ul className="space-y-3">
              {travelTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary mr-2 mt-1">💡</span>
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Modal for editing items */}
        {isEditModalOpen && currentEditItem && (
          <EditItemModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setCurrentEditItem(null);
              setEditError(null);
            }}
            onSubmit={handleEditSubmit}
            itemTitle={currentEditItem.title || (currentEditItem as any).name || (currentEditItem as any).venue || 'Item'}
            itemType={'venue' in currentEditItem ? 'meal' : 'name' in currentEditItem ? 'accommodation' : 'activity'}
            isSubmitting={isEditing}
            error={editError}
          />
        )}
      </div>
      
      {renderPopup()}
    </>
  );
}

// Component for a single day column
function DayColumn({ 
  day, 
  index, 
  onSelectItem, 
  isActive 
}: { 
  day: Day; 
  index: number; 
  onSelectItem: (item: BaseItem, event: React.MouseEvent<HTMLDivElement>) => void; 
  isActive: (item: BaseItem) => boolean;
}) {
  const toggleItem = (item: BaseItem, event: React.MouseEvent<HTMLDivElement>) => {
    console.log('Toggle item clicked:', item.id, item.title);
    onSelectItem(item, event);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short',
      day: 'numeric' 
    });
  };
  
  // Display the proper day number (either from day.day or index+1)
  const dayNumber = (day as any).day || index + 1;
  
  // Group activities by time periods (morning, afternoon, evening) for sorting
  const getTimePeriod = (time: string) => {
    // Special case for accommodation
    if (time === 'Night' || time === 'night' || time === 'Staying at') {
      return 'night';
    }
    
    const lowerTime = time.toLowerCase();
    
    if (lowerTime.includes('morning') || 
        lowerTime.includes('breakfast') ||
        lowerTime.includes('am') ||
        lowerTime.includes('early')) {
      return 'morning';
    }
    
    if (lowerTime.includes('afternoon') || 
        lowerTime.includes('lunch') ||
        (lowerTime.includes('pm') && (
          lowerTime.includes('12') ||
          lowerTime.includes('1') ||
          lowerTime.includes('2') ||
          lowerTime.includes('3') ||
          lowerTime.includes('4')
        ))) {
      return 'afternoon';
    }
    
    if (lowerTime.includes('evening') || 
        lowerTime.includes('dinner') ||
        lowerTime.includes('night') ||
        (lowerTime.includes('pm') && !(
          lowerTime.includes('12') ||
          lowerTime.includes('1') ||
          lowerTime.includes('2') ||
          lowerTime.includes('3') ||
          lowerTime.includes('4')
        )) ||
        lowerTime.includes('late')) {
      return 'evening';
    }
    
    return 'other';
  };
  
  // Create a combined array of all day items (activities, meals, accommodation)
  const getAllDayItems = () => {
    const items: Array<BaseItem> = [];
    
    // Add accommodation first if it exists (to put it at the top)
    if (day.accommodation) {
      const acc = day.accommodation;
      
      // Determine the appropriate label based on check-in/check-out status
      let timeLabel = 'Staying at';
      if (acc.checkInOut === 'check-in') {
        timeLabel = 'Check-in';
      } else if (acc.checkInOut === 'check-out') {
        timeLabel = 'Check-out';
      }

      console.log('Adding accommodation:', acc.name, 'with checkInOut:', acc.checkInOut, 'timeLabel:', timeLabel);
      
      items.push({
        id: `accommodation-${Math.random().toString(36).substr(2, 9)}`,
        time: timeLabel,
        title: acc.name || 'Accommodation',
        description: acc.description || '',
        location: acc.name || '',
        coordinates: acc.coordinates || { lat: 0, lng: 0 },
        cost: acc.cost || 0,
        type: 'accommodation'
      });
    }
    
    // Add activities
    if (day.activities && day.activities.length > 0) {
      items.push(...day.activities.map(activity => ({
        id: activity.id || `activity-${Math.random().toString(36).substr(2, 9)}`,
        time: activity.time || '',
        title: activity.title || '',
        description: activity.description || '',
        location: activity.location || activity.title || '', // Fallback to title if location is missing
        coordinates: activity.coordinates || { lat: 0, lng: 0 },
        cost: activity.cost || 0,
        type: 'activity',
        transportMode: activity.transportMode,
        transportCost: activity.transportCost
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
        coordinates: meal.coordinates || { lat: 0, lng: 0 },
        cost: meal.cost || 0,
        type: 'meal',
        transportMode: meal.transportMode,
        transportCost: meal.transportCost
      })));
    }
    
    // Sort all items by time of day, but keep accommodation at the top
    return items.sort((a, b) => {
      // Always keep accommodation at the top
      if (a.type === 'accommodation') return -1;
      if (b.type === 'accommodation') return 1;
      
      // For non-accommodation items, sort by time as before
      const getTimeOrder = (item: BaseItem) => {
        const period = getTimePeriod(item.time);
        switch (period) {
          case 'morning': return 0;
          case 'afternoon': return 1;
          case 'evening': return 2;
          case 'night': return 3;
          default: return 4;
        }
      };
      
      const aOrder = getTimeOrder(a);
      const bOrder = getTimeOrder(b);
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      const typeOrder = {
        'activity': 0,
        'meal': 1, 
        'transport': 2
      };
      
      return (typeOrder[a.type as keyof typeof typeOrder] || 3) - 
             (typeOrder[b.type as keyof typeof typeOrder] || 3);
    });
  };
  
  const allDayItems = getAllDayItems();
  console.log('All day items for day', dayNumber, ':', allDayItems.map(item => ({ id: item.id, title: item.title, type: item.type })));
  
  return (
    <div 
      className="flex-shrink-0 w-72 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 relative day-container print:w-full print:mb-8"
    >
      <div className="bg-primary text-white p-2 sticky top-0 day-title">
        <h3 className="font-bold">
          Day {dayNumber}: {formatDate(day.date)}
        </h3>
        {day.title && (
          <p className="text-xs text-white opacity-90 mt-1">{day.title}</p>
        )}
      </div>
      
      <div className="p-3" style={{ height: `auto`, minHeight: '200px' }}>
        <div className="space-y-2">
          {allDayItems.map(item => (
            <ItemCard 
              key={item.id}
              item={item}
              isActive={isActive(item)}
              onClick={(e) => toggleItem(item, e)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Component for displaying item info in day column
const ItemCard = ({ item, isActive, onClick }: { 
  item: BaseItem; 
  isActive: boolean; 
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void 
}) => {
  const colors = getItemColors(item.type);
  
  return (
    <div
      className={`rounded-lg p-2 border ${colors.bg} ${colors.border} cursor-pointer hover:shadow-md transition-shadow ${isActive ? 'ring-2 ring-primary' : ''} activity-item`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
          <span className="text-lg">{colors.icon}</span>
          <h4 className={`font-medium text-sm ${colors.text} activity-title`}>{item.title}</h4>
        </div>
        <div className="text-xs font-medium text-primary">
          {typeof item.cost === 'string' 
            ? (parseFloat(item.cost.toString()) === 0 ? 'Free' : `$${parseFloat(item.cost.toString()).toFixed(2)}`)
            : (item.cost === 0 ? 'Free' : `$${item.cost.toFixed(2)}`)}
        </div>
      </div>
      
      {/* Only show description for activities, not for meals, to save space */}
      {item.type === 'activity' && (
        <p className="text-xs text-gray-700 mt-1 line-clamp-1 activity-description">
          {item.description.length > 60 
            ? `${item.description.substring(0, 60)}...` 
            : item.description}
        </p>
      )}
      
      <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-200 border-opacity-50">
        <div className="flex items-center text-xs text-gray-500">
          <span className="mr-1">📍</span> 
          <span className="truncate max-w-[90px]">{item.location || "No location"}</span>
        </div>
        <div className="flex items-center text-xs text-gray-500 activity-time">
          <span className="mr-1">⏱️</span> {item.time}
        </div>
      </div>
    </div>
  );
}

function ItemDetailPopup({ 
  item, 
  position,
  onClose,
  createGoogleMapsLink,
  onEditClick 
}: { 
  item: BaseItem;
  position: { x: number; y: number };
  onClose: () => void;
  createGoogleMapsLink: (coordinates: Location, title: string, location?: string) => string;
  onEditClick?: (item: BaseItem) => void;
}) {
  const colors = getItemColors(item.type);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  // Check if coordinates are precise enough (not just generic city coordinates)
  const hasDetailedCoordinates = useCallback(() => {
    // Check if coordinates exist
    if (!item.coordinates || !item.coordinates.lat || !item.coordinates.lng) {
      return false;
    }
    
    // If coordinates have many decimal places, they're likely specific location coordinates
    // A location with 4+ decimal places is precise within 11 meters
    const latString = item.coordinates.lat.toString();
    const lngString = item.coordinates.lng.toString();
    const latPrecision = latString.includes('.') ? latString.split('.')[1].length : 0;
    const lngPrecision = lngString.includes('.') ? lngString.split('.')[1].length : 0;
    
    return latPrecision >= 4 && lngPrecision >= 4;
  }, [item.coordinates]);

  // Set verification state once on component mount
  useEffect(() => {
    if (item.coordinates && item.coordinates.lat && item.coordinates.lng) {
      setIsVerifyingLocation(!hasDetailedCoordinates());
    }
  }, [hasDetailedCoordinates]);
  
  // Create maps URL
  const getMapsUrl = useCallback(() => {
    if (!item.coordinates || !item.coordinates.lat || !item.coordinates.lng) return '';
    return createGoogleMapsLink(item.coordinates, item.title, item.location);
  }, [item.coordinates, item.title, item.location, createGoogleMapsLink]);

  // Close when clicking outside or escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      // Only close if clicking outside the popup
      const popupElement = document.getElementById('item-detail-popup');
      if (popupElement && !popupElement.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Format currency helper
  const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined) return "Free";
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return "Free";
    
    return `$${numValue.toFixed(2)}`;
  };

  // Get transportation emoji based on transport mode
  const transportEmoji = getTransportEmoji(item.transportMode);

  return (
    <div 
      id="item-detail-popup"
      className="fixed z-50 animate-scaleIn"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      <div 
        className={`bg-white rounded-xl shadow-xl overflow-hidden ${colors.border} border w-80`}
        style={{
          maxHeight: 'calc(100vh - 100px)',
        }}
      >
        {/* Header */}
        <div className={`${colors.bg} px-5 py-4 relative`}>
          <div className="absolute right-4 top-4 flex space-x-2">
            {onEditClick && (
              <button
                onClick={() => {
                  onClose();
                  onEditClick(item);
                }}
                className="text-gray-500 hover:text-primary rounded-full h-8 w-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Edit"
                title="Edit this item"
              >
                <FaEdit size={16} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 rounded-full h-8 w-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close"
            >
              <FaTimes size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-2xl">{colors.icon}</span>
            <div>
              <h3 className="font-semibold text-base">{item.title}</h3>
              <p className="text-xs text-gray-600">{item.time}</p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Description */}
          <p className="text-sm text-gray-800 whitespace-pre-line">{item.description}</p>
          
          {/* Location with Transportation */}
          {item.location && (
            <div className="text-sm text-gray-700">
              <div className="flex items-start">
                <div className="flex-shrink-0 text-lg mr-2">
                  <FaMapMarkerAlt className="text-red-500" />
                </div>
                <div>
                  <div className="flex items-center">
                    <span>{item.location}</span>
                  </div>
                  {item.transportMode && (
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <span className="mr-1">{transportEmoji}</span>
                      <span>{item.transportMode}</span>
                      {item.transportCost !== undefined && item.transportCost !== 0 && (
                        <span className="ml-1">({formatCurrency(item.transportCost)})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Cost */}
          <div className="flex items-center text-sm font-medium">
            <span className="mr-2">💰</span>
            <span className="text-primary">
              {typeof item.cost === 'string' 
                ? (parseFloat(item.cost.toString()) === 0 ? 'Free' : `$${parseFloat(item.cost.toString()).toFixed(2)}`)
                : (item.cost === 0 ? 'Free' : `$${item.cost.toFixed(2)}`)}
            </span>
          </div>
          
          {/* Maps Button */}
          {item.coordinates && item.coordinates.lat && item.coordinates.lng && (
            <a 
              href={getMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-opacity-90 mt-2 text-sm font-medium"
            >
              <FaMapMarkerAlt className="mr-2" /> 
              {isVerifyingLocation ? 'Find on Google Maps' : 'View on Google Maps'}
            </a>
          )}
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
  
  // Format currency - show "Free" for zero values
  const formatCurrency = (value: number): string => {
    if (value === 0) return "Free";
    return `$${value.toFixed(2)}`;
  };
  
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-xl font-bold text-primary">{formatCurrency(calculatedTotal)}</p>
        <p className="text-sm text-gray-500">Total Trip Budget</p>
      </div>
      
      <div className="space-y-3 budget-table">
        <div className="flex justify-between items-center pb-1 border-b text-sm">
          <p className="font-medium">Category</p>
          <p className="font-medium">Amount</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
            <span>Accommodation</span>
          </p>
          <p className="text-sm">{formatCurrency(accommodation)}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
            <span>Food</span>
          </p>
          <p className="text-sm">{formatCurrency(food)}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
            <span>Activities</span>
          </p>
          <p className="text-sm">{formatCurrency(activities)}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            <span>Transportation</span>
          </p>
          <p className="text-sm">{formatCurrency(transport)}</p>
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

// Helper function to get transportation emoji
const getTransportEmoji = (transportMode?: string): string => {
  if (!transportMode) return '';
  
  const mode = transportMode.toLowerCase();
  if (mode.includes('walk')) return '🚶';
  if (mode.includes('taxi') || mode.includes('cab') || mode.includes('uber')) return '🚕';
  if (mode.includes('bus')) return '🚌';
  if (mode.includes('train') || mode.includes('subway') || mode.includes('metro')) return '🚆';
  if (mode.includes('bike') || mode.includes('bicycle')) return '🚲';
  if (mode.includes('car') || mode.includes('drive')) return '🚗';
  if (mode.includes('plane') || mode.includes('fly') || mode.includes('flight')) return '✈️';
  if (mode.includes('boat') || mode.includes('ferry')) return '⛴️';
  
  // Default for other transportation modes
  return '🚕';
};

// Helper function to get emoji based on item type
const getItemTypeEmoji = (item: BaseItem): string => {
  if (item.type === 'meal') {
    return '🍽️';
  } else if (item.type === 'accommodation') {
    return '🏨';
  } else if (item.transportMode) {
    return getTransportEmoji(item.transportMode);
  } else {
    return '🗺️'; // Default for activities
  }
};