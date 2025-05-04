import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

// Add global type declaration for the google object
declare global {
  interface Window {
    google: typeof google;
    currentInfoWindow?: google.maps.InfoWindow;
  }
}

// Global state to track if Google Maps is loaded
// This helps prevent duplicate script loading across the application
let isGoogleMapsLoaded = false;
let isGoogleMapsLoading = false;

// Location type with coordinates
type Location = {
  lat: number;
  lng: number;
};

// Activity type with all details
type Activity = {
  id?: string;
  time: string;
  title: string;
  description: string;
  location?: string;
  coordinates: Location;
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
  coordinates: Location;
};

// Accommodation type
type Accommodation = {
  id?: string;
  name: string;
  description: string;
  cost: number | string;
  coordinates: Location;
};

// Day with activities
type Day = {
  date: string;
  activities: Activity[];
  meals?: Meal[];
  accommodation?: Accommodation;
  title?: string;
  summary?: string;
};

// Props for the map component
interface ItineraryMapViewProps {
  days: Day[];
}

// Colors for different days
const dayColors = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#34495e', // Dark Blue
];

// Type icons/scales
const typeConfig = {
  activity: { scale: 8 },
  meal: { scale: 7 },
  accommodation: { scale: 9 }
};

// Google Maps API libraries to load
const libraries: ["places"] = ["places"];

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.375rem',
};

export default function ItineraryMapView({ days }: ItineraryMapViewProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [google, setGoogle] = useState<any>(null);
  const [visibleTypes, setVisibleTypes] = useState({
    activity: true,
    meal: true,
    accommodation: true
  });

  // Store markers by type for filtering
  const markersRef = useRef<{
    activity: google.maps.Marker[];
    meal: google.maps.Marker[];
    accommodation: google.maps.Marker[];
  }>({
    activity: [],
    meal: [],
    accommodation: []
  });

  // Function to toggle marker visibility by type
  const toggleMarkerVisibility = (type: 'activity' | 'meal' | 'accommodation') => {
    const isCurrentlyVisible = visibleTypes[type];
    setVisibleTypes(prev => ({ ...prev, [type]: !isCurrentlyVisible }));
    
    if (markersRef.current[type]) {
      markersRef.current[type].forEach(marker => {
        marker.setVisible(!isCurrentlyVisible);
      });
    }
  };

  // Load the Google Maps script using our secure API route
  useEffect(() => {
    const loadGoogleMapsScript = async () => {
      try {
        // Check if maps is already loaded globally
        if (window.google?.maps) {
          console.log('Google Maps already loaded globally');
          setIsLoaded(true);
          setGoogle(window.google);
          isGoogleMapsLoaded = true;
          return;
        }

        // Check if script is currently being loaded by another component
        if (isGoogleMapsLoading || document.getElementById('google-maps-script')) {
          console.log('Google Maps is already loading');
          
          // Set up a polling interval to check when it's loaded
          const checkInterval = setInterval(() => {
            if (window.google?.maps) {
              console.log('Google Maps loaded during waiting period');
              setIsLoaded(true);
              setGoogle(window.google);
              isGoogleMapsLoaded = true;
              clearInterval(checkInterval);
            }
          }, 200);
          
          // Clear interval after 10 seconds to prevent memory leaks
          setTimeout(() => clearInterval(checkInterval), 10000);
          
          return;
        }

        // Mark as loading
        isGoogleMapsLoading = true;

        // Fetch the Google Maps URL with API key from our server
        const response = await fetch('/api/google-maps');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Google Maps URL: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.url) {
          throw new Error('Google Maps URL not returned from server');
        }

        // Create script element
        const script = document.createElement('script');
        script.src = data.url;
        script.async = true;
        script.defer = true;
        script.id = 'google-maps-script';
        
        // Handle script loading
        script.onload = () => {
          console.log('Google Maps script loaded successfully');
          setIsLoaded(true);
          setGoogle(window.google);
          isGoogleMapsLoaded = true;
          isGoogleMapsLoading = false;
        };
        
        script.onerror = (e) => {
          console.error('Error loading Google Maps script', e);
          setLoadError(new Error('Failed to load Google Maps script'));
          isGoogleMapsLoading = false;
        };
        
        // Add script to document
        document.head.appendChild(script);
        
        // Cleanup function
        return () => {
          // Don't remove the script as it may be used by other components
        };
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setLoadError(err instanceof Error ? err : new Error('Unknown error loading Google Maps'));
        setError('Failed to load Google Maps. Please try again later.');
        isGoogleMapsLoading = false;
      }
    };

    loadGoogleMapsScript();
    
    // Cleanup on component unmount
    return () => {
      // Only clean up our state, don't remove the script
    };
  }, []);

  // Flatten all activities, meals, and accommodations into a single array for the map
  const allMapItems = React.useMemo(() => days.flatMap(day => {
    const items = [...day.activities];
    
    // Add meals if available
    if (day.meals && day.meals.length > 0) {
      items.push(...day.meals.map(meal => ({
        id: meal.id || `meal-${Math.random().toString(36).substr(2, 9)}`,
        time: meal.type,
        title: meal.venue,
        description: meal.description,
        location: meal.venue,
        coordinates: meal.coordinates,
        cost: meal.cost
      } as Activity)));
    }
    
    // Add accommodation if available
    if (day.accommodation) {
      const acc = day.accommodation;
      items.push({
        id: `acc-${Math.random().toString(36).substr(2, 9)}`,
        time: 'Night',
        title: acc.name,
        description: acc.description,
        location: acc.name,
        coordinates: acc.coordinates,
        cost: acc.cost
      } as Activity);
    }
    
    return items;
  }), [days]);
  
  // Find center coordinates for the map (average of all points)
  const getCenterCoordinates = useCallback((): google.maps.LatLngLiteral => {
    // Default to center of USA if no activities
    if (allMapItems.length === 0) return { lat: 39.8283, lng: -98.5795 };
    
    // Filter out invalid coordinates
    const validItems = allMapItems.filter(
      item => item && 
      item.coordinates && 
      typeof item.coordinates === 'object' &&
      item.coordinates.lat !== undefined && 
      item.coordinates.lng !== undefined &&
      !isNaN(Number(item.coordinates.lat)) && 
      !isNaN(Number(item.coordinates.lng)) &&
      isFinite(Number(item.coordinates.lat)) && 
      isFinite(Number(item.coordinates.lng))
    );
    
    if (validItems.length === 0) return { lat: 39.8283, lng: -98.5795 };
    
    const sumLat = validItems.reduce((sum, item) => sum + Number(item.coordinates.lat), 0);
    const sumLng = validItems.reduce((sum, item) => sum + Number(item.coordinates.lng), 0);
    
    return { 
      lat: sumLat / validItems.length, 
      lng: sumLng / validItems.length 
    };
  }, [allMapItems]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return formattedDate;
    } catch (e) {
      return dateString;
    }
  };

  // Render map with activities
  const renderMap = () => {
    if (!isLoaded || !google) {
      return (
        <div className="h-full w-full flex justify-center items-center bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-gray-700">Loading map...</p>
          </div>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="h-full w-full flex justify-center items-center bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <p className="text-red-500 font-medium mb-1">Failed to load Google Maps</p>
            <p className="text-gray-700 text-sm">Please check your internet connection and try again.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full relative">
        <div 
          ref={mapRef} 
          className="h-full w-full rounded-md"
          style={{ minHeight: '100%', minWidth: '100%' }}
        ></div>
        
        {/* Filter box */}
        <div className="absolute top-2 left-2 bg-white p-2 rounded-lg shadow-md max-w-[180px] bg-opacity-95 text-xs">
          <p className="font-semibold mb-1 text-gray-800">Show/Hide:</p>
          <div>
            <label 
              htmlFor="filter-activities"
              className="flex items-center h-8 cursor-pointer px-1 hover:bg-gray-50 rounded-md"
            >
              <input 
                type="checkbox" 
                id="filter-activities"
                className="mr-2 h-4 w-4 accent-blue-500" 
                checked={visibleTypes.activity}
                onChange={() => toggleMarkerVisibility('activity')}
              />
              <span className="font-medium">Activities</span>
            </label>
            
            <label 
              htmlFor="filter-meals"
              className="flex items-center h-8 cursor-pointer px-1 hover:bg-gray-50 rounded-md"
            >
              <input 
                type="checkbox" 
                id="filter-meals"
                className="mr-2 h-4 w-4 accent-blue-500" 
                checked={visibleTypes.meal}
                onChange={() => toggleMarkerVisibility('meal')}
              />
              <span className="font-medium">Restaurants</span>
            </label>
            
            <label 
              htmlFor="filter-accommodation"
              className="flex items-center h-8 cursor-pointer px-1 hover:bg-gray-50 rounded-md"
            >
              <input 
                type="checkbox" 
                id="filter-accommodation"
                className="mr-2 h-4 w-4 accent-blue-500" 
                checked={visibleTypes.accommodation}
                onChange={() => toggleMarkerVisibility('accommodation')}
              />
              <span className="font-medium">Accommodation</span>
            </label>
          </div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-white p-2 rounded-lg shadow-md max-w-[180px] bg-opacity-95 text-xs">
          <p className="font-semibold mb-1 text-gray-800">Trip Days:</p>
          <div>
            {days.map((day, index) => (
              <div key={day.date} className="flex items-center h-6">
                <span 
                  className="inline-block w-4 h-4 rounded-full mr-2 flex-shrink-0"
                  style={{ backgroundColor: dayColors[index % dayColors.length] }}
                ></span>
                <span className="font-medium text-gray-700 truncate">
                  Day {index + 1}: {formatDate(day.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Set up map when Google is loaded
  useEffect(() => {
    // Return early if not loaded or ref not available
    if (!isLoaded || !google || !mapRef.current) {
      return;
    }
    
    // Avoid re-initializing the map on every render
    // Only initialize it when the required dependencies change
    const mapId = `map-${days.length}-${isLoaded}-${!!google}`;
    
    // Ensure the DOM element is present and accessible
    const mapElement = mapRef.current;
    if (!mapElement || !(mapElement instanceof Element)) {
      console.error('Map element is not a valid DOM element');
      return;
    }

    // Clear existing markers before creating new ones
    Object.values(markersRef.current).forEach(markers => {
      markers.forEach(marker => {
        marker.setMap(null);
      });
    });
    
    // Reset markers
    markersRef.current = {
      activity: [],
      meal: [],
      accommodation: []
    };
    
    try {
      // Initialize the map
      const newMap = new google.maps.Map(mapElement, {
        center: getCenterCoordinates(),
        zoom: 8,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      setMapInstance(newMap);
      
      // Check if we have valid coordinates
      const validActivities = allMapItems.filter(
         activity => activity && 
         activity.coordinates && 
         typeof activity.coordinates === 'object' &&
         activity.coordinates.lat !== undefined && 
         activity.coordinates.lng !== undefined
      );
      
      if (validActivities.length === 0) {
        console.log('No valid coordinates found in activities');
        return;
      }
      
      // Track all bounds to auto-fit the map
      const bounds = new google.maps.LatLngBounds();
      
      // Wait for map to be initialized
      google.maps.event.addListenerOnce(newMap, 'idle', () => {
        // Create a marker for each activity
        days.forEach((day, dayIndex) => {
          // Get color for this day
          const dayColor = dayColors[dayIndex % dayColors.length];
          
          // Create markers for all activities in this day
          if (day.activities) {
            day.activities.forEach(activity => {
              // Skip if no valid coordinates
              if (!activity.coordinates || 
                  !isFinite(Number(activity.coordinates.lat)) || 
                  !isFinite(Number(activity.coordinates.lng))) {
                return;
              }
              
              // Create marker
              createMarker(activity, day.date, dayColor, 'activity', newMap, bounds, dayIndex);
            });
          }
          
          // Add markers for meals if they exist
          if (day.meals && day.meals.length > 0) {
            day.meals.forEach(meal => {
              // Skip if no valid coordinates
              if (!meal.coordinates || 
                  !isFinite(Number(meal.coordinates.lat)) || 
                  !isFinite(Number(meal.coordinates.lng))) {
                return;
              }
              
              // Create a marker for meals
              createMarker({
                id: meal.id || `meal-${Math.random().toString(36).substr(2, 9)}`,
                time: meal.type,
                title: meal.venue,
                description: meal.description,
                location: meal.venue,
                coordinates: meal.coordinates,
                cost: meal.cost
              }, day.date, dayColor, 'meal', newMap, bounds, dayIndex);
            });
          }
          
          // Add marker for accommodation if it exists
          if (day.accommodation) {
            const acc = day.accommodation;
            // Skip if no valid coordinates
            if (!acc.coordinates || 
                !isFinite(Number(acc.coordinates.lat)) || 
                !isFinite(Number(acc.coordinates.lng))) {
              return;
            }
            
            // Create marker for accommodation
            createMarker({
              id: `acc-${Math.random().toString(36).substr(2, 9)}`,
              time: 'Night',
              title: acc.name,
              description: acc.description,
              location: acc.name,
              coordinates: acc.coordinates,
              cost: acc.cost
            }, day.date, dayColor, 'accommodation', newMap, bounds, dayIndex);
          }
        });
        
        // Fit map to all markers
        if (!bounds.isEmpty()) {
          newMap.fitBounds(bounds);
          
          // Zoom out a bit if we only have one marker
          if (validActivities.length === 1) {
            const listener = google.maps.event.addListener(newMap, 'idle', function() {
              newMap.setZoom(12);
              google.maps.event.removeListener(listener);
            });
          }
        }
      });
    } catch (e) {
      console.error('Error initializing map:', e);
      setError('Error initializing map');
    }
    
    // The dependency array should only include stable dependencies
    // Using a string representing the state avoids re-initializing the map on each render
  }, [isLoaded, google, getCenterCoordinates, mapRef, days]);

  // Create a marker with custom icon and info window
  const createMarker = (
    activity: Activity, 
    dayDate: string, 
    dayColor: string,
    itemType: string,
    map: google.maps.Map,
    bounds: google.maps.LatLngBounds,
    dayIndex: number = 0
  ) => {
    // Validate coordinates before proceeding
    if (!activity || 
        !activity.coordinates || 
        !isFinite(Number(activity.coordinates.lat)) || 
        !isFinite(Number(activity.coordinates.lng))) {
      return null;
    }
    
    const position = {
      lat: Number(activity.coordinates.lat),
      lng: Number(activity.coordinates.lng)
    };
    
    // Add to bounds
    bounds.extend(position);
    
    // Use different scale based on marker type, but same color for the day
    const icon = {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: dayColor,
      fillOpacity: 1,
      strokeWeight: 1.5,
      strokeColor: '#FFFFFF',
      scale: typeConfig[itemType as keyof typeof typeConfig]?.scale || 8
    };
    
    // Helper function to create a Google Maps link
    const createGoogleMapsLink = (coordinates: Location, title: string) => {
      return `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}&query_place_id=${encodeURIComponent(title)}`;
    };
    
    // Create the marker
    const marker = new google.maps.Marker({
      position,
      map,
      icon,
      title: activity.title
    });
    
    // Store marker by type for filtering
    if (itemType === 'activity' || itemType === 'meal' || itemType === 'accommodation') {
      markersRef.current[itemType].push(marker);
    }
    
    // Create info window content with day information
    const contentString = `
      <div class="p-3" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 220px;">
        <h3 class="font-bold text-sm mb-1">${activity.title}</h3>
        <div class="flex items-center mb-1">
          <span class="inline-block w-3 h-3 rounded-full mr-1" 
                style="background-color: ${dayColor}"></span>
          <p class="text-xs text-gray-600">
            Day ${dayIndex + 1}: ${formatDate(dayDate)} • ${activity.time}
          </p>
        </div>
        <p class="text-xs text-gray-700">${activity.description}</p>
        ${activity.location ? 
          `<p class="text-xs text-gray-700 mt-1">
            <strong class="font-medium">Location:</strong> ${activity.location}
          </p>` : ''}
        <a href="${createGoogleMapsLink(activity.coordinates, activity.title)}" 
           target="_blank" 
           rel="noopener noreferrer"
           class="block mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
          View on Google Maps
        </a>
      </div>
    `;
    
    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: contentString,
      ariaLabel: activity.title,
      maxWidth: 220
    });
    
    // Add click listener to open info window
    marker.addListener('click', () => {
      // Close any open info window first
      if (window.currentInfoWindow) {
        window.currentInfoWindow.close();
      }
      
      infoWindow.open({
        anchor: marker,
        map,
      });
      
      window.currentInfoWindow = infoWindow;
      
      // Set the selected activity
      if (activity.id) {
        setSelectedActivity(activity);
      }
    });
    
    return marker;
  };

  // Clean up markers when component unmounts or days change
  useEffect(() => {
    return () => {
      // Clear all marker references
      Object.values(markersRef.current).forEach(markers => {
        markers.forEach(marker => {
          marker.setMap(null);
        });
      });
      
      // Reset markers
      markersRef.current = {
        activity: [],
        meal: [],
        accommodation: []
      };
    };
  }, [days]);

  return renderMap();
} 