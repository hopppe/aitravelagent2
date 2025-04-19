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
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  coordinates: Location;
  cost: number | string;
  image?: string;
};

// Day with activities
type Day = {
  date: string;
  activities: Activity[];
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

  // Flatten all activities into a single array
  const allActivities = days.flatMap(day => day.activities);
  
  // Find center coordinates for the map (average of all points)
  const getCenterCoordinates = useCallback((): google.maps.LatLngLiteral => {
    // Default to center of USA if no activities
    if (allActivities.length === 0) return { lat: 39.8283, lng: -98.5795 };
    
    // Filter out invalid coordinates
    const validActivities = allActivities.filter(
      activity => activity && 
      activity.coordinates && 
      typeof activity.coordinates === 'object' &&
      activity.coordinates.lat !== undefined && 
      activity.coordinates.lng !== undefined &&
      !isNaN(Number(activity.coordinates.lat)) && 
      !isNaN(Number(activity.coordinates.lng)) &&
      isFinite(Number(activity.coordinates.lat)) && 
      isFinite(Number(activity.coordinates.lng))
    );
    
    if (validActivities.length === 0) return { lat: 39.8283, lng: -98.5795 };
    
    const sumLat = validActivities.reduce((sum, activity) => sum + Number(activity.coordinates.lat), 0);
    const sumLng = validActivities.reduce((sum, activity) => sum + Number(activity.coordinates.lng), 0);
    
    return { 
      lat: sumLat / validActivities.length, 
      lng: sumLng / validActivities.length 
    };
  }, [allActivities]);

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-700">Loading map...</p>
          </div>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="h-full w-full flex justify-center items-center bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">Failed to load Google Maps</p>
            <p className="text-gray-700 text-sm">Please check your internet connection and try again.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full relative">
        <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}></div>
        
        {/* Simple legend */}
        <div className="absolute bottom-2 left-2 bg-white p-2 rounded-lg shadow-md text-xs max-w-fit">
          <p className="font-medium mb-1">Trip Days:</p>
          <div className="space-y-1">
            {days.map((day, index) => (
              <div key={day.date} className="flex items-center">
                <span 
                  className="inline-block w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: dayColors[index % dayColors.length] }}
                ></span>
                <span>Day {index + 1}: {formatDate(day.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Initialize map once it's loaded
  useEffect(() => {
    if (isLoaded && google && mapRef.current && !mapInstance) {
      const map = new google.maps.Map(mapRef.current, {
        center: getCenterCoordinates(),
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
      
      setMapInstance(map);
      
      // Check if we have valid coordinates
      const validActivities = allActivities.filter(
        activity => activity && 
        activity.coordinates && 
        typeof activity.coordinates === 'object' &&
        activity.coordinates.lat !== undefined && 
        activity.coordinates.lng !== undefined &&
        !isNaN(Number(activity.coordinates.lat)) && 
        !isNaN(Number(activity.coordinates.lng)) &&
        isFinite(Number(activity.coordinates.lat)) && 
        isFinite(Number(activity.coordinates.lng))
      );
      
      // Fit bounds to include all markers if we have valid coordinates
      if (validActivities.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        
        validActivities.forEach(activity => {
          bounds.extend({
            lat: Number(activity.coordinates.lat),
            lng: Number(activity.coordinates.lng)
          });
        });
        
        map.fitBounds(bounds);
        
        // Set a reasonable zoom level if we only have one marker
        if (validActivities.length === 1) {
          map.setZoom(14);
        }
      }
      
      // Add markers and polylines for each day
      days.forEach((day, dayIndex) => {
        const dayColor = dayColors[dayIndex % dayColors.length];
        const validDayActivities = day.activities.filter(
          activity => activity && 
          activity.coordinates && 
          typeof activity.coordinates === 'object' &&
          activity.coordinates.lat !== undefined && 
          activity.coordinates.lng !== undefined &&
          !isNaN(Number(activity.coordinates.lat)) && 
          !isNaN(Number(activity.coordinates.lng)) &&
          isFinite(Number(activity.coordinates.lat)) && 
          isFinite(Number(activity.coordinates.lng))
        );
        
        // Add markers
        const markers: google.maps.Marker[] = [];
        validDayActivities.forEach((activity, activityIndex) => {
          const marker = new google.maps.Marker({
            position: {
              lat: Number(activity.coordinates.lat),
              lng: Number(activity.coordinates.lng)
            },
            map: map,
            label: {
              text: `${activityIndex + 1}`,
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: dayColor,
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 14
            }
          });
          
          // Add click listener for info window
          marker.addListener('click', () => {
            // Close any open info window
            if (window.currentInfoWindow) {
              window.currentInfoWindow.close();
            }
            
            // Create info window content
            const content = document.createElement('div');
            content.className = 'max-w-xs p-2';
            content.innerHTML = `
              <h3 class="font-medium text-sm mb-1">${activity.title}</h3>
              <p class="text-xs text-gray-500 mb-1">${activity.time}</p>
              <p class="text-xs mb-1">${activity.location}</p>
            `;
            
            // Create and open info window
            const infoWindow = new google.maps.InfoWindow({
              content: content
            });
            
            infoWindow.open({
              anchor: marker,
              map: map
            });
            
            // Store reference to current info window
            window.currentInfoWindow = infoWindow;
            
            setSelectedActivity(activity);
          });
          
          markers.push(marker);
        });
        
        // Add polyline if we have at least 2 valid activities
        if (validDayActivities.length >= 2) {
          const path = validDayActivities.map(activity => ({
            lat: Number(activity.coordinates.lat),
            lng: Number(activity.coordinates.lng)
          }));
          
          new google.maps.Polyline({
            path: path,
            map: map,
            strokeColor: dayColor,
            strokeWeight: 3,
            strokeOpacity: 0.7
          });
        }
      });
    }
  }, [isLoaded, google, days, allActivities, getCenterCoordinates]);

  return renderMap();
} 