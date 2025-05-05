'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { FaEdit, FaShare } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import useBudgetCalculator from '../../../hooks/useBudgetCalculator';

// Lazy load heavy components
const ItineraryTabs = lazy(() => import('../../../components/trips/ItineraryTabs'));
const BookingServices = lazy(() => import('../../../components/trips/BookingServices'));

// Helper function to ensure valid coordinates and data structure
function ensureValidCoordinates(itinerary: any) {
  if (!itinerary || !itinerary.days || !Array.isArray(itinerary.days)) {
    return itinerary;
  }
  
  console.log('Validating itinerary data structure...');
  let issuesFixed = 0;
  
  // Ensure budget exists and has proper structure
  if (!itinerary.budget || typeof itinerary.budget !== 'object') {
    console.log('Creating budget object from individual costs');
    itinerary.budget = {
      accommodation: 0,
      food: 0,
      activities: 0,
      transport: 0,
      total: 0
    };
    issuesFixed++;
  }

  // Always calculate budget values from actual items
  console.log('Calculating all budget values from individual costs');
  
  // Calculate accommodation costs
  let totalAccommodationCost = 0;
  // For accommodation, we need to exclude the last day since accommodation is calculated by nights, not days
  // For a 4-day trip, there are only 3 nights
  const lastDayIndex = itinerary.days.length - 1;
  
  for (let i = 0; i < itinerary.days.length; i++) {
    const day = itinerary.days[i];
    // Only count accommodation costs for days before the last day
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
  itinerary.budget.accommodation = totalAccommodationCost;
  
  // Calculate activities cost
  let totalActivitiesCost = 0;
  for (const day of itinerary.days) {
    if (day.activities && Array.isArray(day.activities)) {
      for (const activity of day.activities) {
        if (activity) {
          const cost = typeof activity.cost === 'string'
            ? isNaN(parseFloat(activity.cost)) ? 0 : parseFloat(activity.cost)
            : (typeof activity.cost === 'number' ? activity.cost : 0);
          totalActivitiesCost += cost;
        }
      }
    }
  }
  itinerary.budget.activities = totalActivitiesCost;
  
  // Calculate transport costs
  let totalTransportCost = 0;
  for (const day of itinerary.days) {
    // Add transport costs from activities
    if (day.activities && Array.isArray(day.activities)) {
      for (const activity of day.activities) {
        if (activity && activity.transportCost) {
          const cost = typeof activity.transportCost === 'string'
            ? isNaN(parseFloat(activity.transportCost)) ? 0 : parseFloat(activity.transportCost)
            : (typeof activity.transportCost === 'number' ? activity.transportCost : 0);
          totalTransportCost += cost;
        }
      }
    }
    
    // Add transport costs from meals
    if (day.meals && Array.isArray(day.meals)) {
      for (const meal of day.meals) {
        if (meal && meal.transportCost) {
          const cost = typeof meal.transportCost === 'string'
            ? isNaN(parseFloat(meal.transportCost)) ? 0 : parseFloat(meal.transportCost)
            : (typeof meal.transportCost === 'number' ? meal.transportCost : 0);
          totalTransportCost += cost;
        }
      }
    }
  }
  itinerary.budget.transport = totalTransportCost;
  
  // Calculate food costs
  let totalFoodCost = 0;
  for (const day of itinerary.days) {
    if (day.meals && Array.isArray(day.meals)) {
      for (const meal of day.meals) {
        if (meal) {
          const cost = typeof meal.cost === 'string'
            ? isNaN(parseFloat(meal.cost)) ? 0 : parseFloat(meal.cost)
            : (typeof meal.cost === 'number' ? meal.cost : 0);
          totalFoodCost += cost;
        }
      }
    }
  }
  itinerary.budget.food = totalFoodCost;
  
  // Calculate total
  itinerary.budget.total = 
    itinerary.budget.accommodation +
    itinerary.budget.food +
    itinerary.budget.activities +
    itinerary.budget.transport;
    
  console.log('Budget calculated:', itinerary.budget);
  
  // Check if this is using budgetEstimate instead of budget
  if (itinerary.budgetEstimate && !itinerary.budget) {
    console.log('Found budgetEstimate but no budget, copying to budget property');
    itinerary.budget = { ...itinerary.budgetEstimate };
    
    // Handle transportation field
    if (itinerary.budget.transportation !== undefined && itinerary.budget.transport === undefined) {
      itinerary.budget.transport = itinerary.budget.transportation;
    }
    
    issuesFixed++;
  }
  
  // Process all days and activities
  for (const day of itinerary.days) {
    if (!day.activities || !Array.isArray(day.activities)) {
      day.activities = [];
      continue;
    }
    
    for (const activity of day.activities) {
      // Skip if not an object
      if (!activity || typeof activity !== 'object') continue;
      
      // Ensure coordinates exist and are properly formatted
      if (!activity.coordinates || typeof activity.coordinates !== 'object') {
        console.log(`Missing coordinates for activity "${activity.title}", adding default coordinates`);
        activity.coordinates = { lat: 40.7128, lng: -74.0060 }; // Default to NYC coordinates
        issuesFixed++;
      } else {
        // Make sure lat and lng are numbers
        let coordinateFixed = false;
        
        if (typeof activity.coordinates.lat !== 'number' && activity.coordinates.lat !== undefined) {
          console.log(`Converting lat coordinate for activity "${activity.title}" from ${typeof activity.coordinates.lat} to number`);
          activity.coordinates.lat = parseFloat(String(activity.coordinates.lat)) || 40.7128;
          coordinateFixed = true;
          issuesFixed++;
        } else if (activity.coordinates.lat === undefined) {
          console.log(`Missing lat coordinate for activity "${activity.title}", adding default`);
          activity.coordinates.lat = 40.7128;
          coordinateFixed = true;
          issuesFixed++;
        }
        
        if (typeof activity.coordinates.lng !== 'number' && activity.coordinates.lng !== undefined) {
          console.log(`Converting lng coordinate for activity "${activity.title}" from ${typeof activity.coordinates.lng} to number`);
          activity.coordinates.lng = parseFloat(String(activity.coordinates.lng)) || -74.0060;
          coordinateFixed = true;
          issuesFixed++;
        } else if (activity.coordinates.lng === undefined) {
          console.log(`Missing lng coordinate for activity "${activity.title}", adding default`);
          activity.coordinates.lng = -74.0060;
          coordinateFixed = true;
          issuesFixed++;
        }
        
        if (coordinateFixed) {
          console.log(`Fixed coordinates for activity "${activity.title}": ${JSON.stringify(activity.coordinates)}`);
        }
      }
      
      // Ensure cost is a number
      if (typeof activity.cost !== 'number') {
        console.log(`Converting cost for activity "${activity.title}" from ${typeof activity.cost} to number`);
        activity.cost = typeof activity.cost === 'string'
          ? isNaN(parseFloat(activity.cost)) ? 0 : parseFloat(activity.cost)
          : 0;
        issuesFixed++;
      }
    }
  }
  
  console.log(`Validation complete. Fixed ${issuesFixed} issues.`);
  return itinerary;
}

// Simple fallback loader
function ComponentLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

export default function GeneratedTripPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Use our budget calculator hook to get normalized budget values
  const normalizedBudget = useBudgetCalculator(itinerary);

  // Debug log for accommodation data
  useEffect(() => {
    if (itinerary?.days?.[0]?.accommodation) {
      console.log('Generated Trip - Accommodation:', {
        name: itinerary.days[0].accommodation.name,
        coordinates: itinerary.days[0].accommodation.coordinates,
        cost: itinerary.days[0].accommodation.cost,
        type: itinerary.days[0].accommodation.type
      });
    } else {
      console.log('Generated Trip - No accommodation data found in first day');
    }
    
    // Also log the budget level for debugging
    console.log('Generated Trip - Budget Level:', itinerary?.budgetLevel || 'moderate');
  }, [itinerary]);

  // Function to save trip to Supabase
  const saveTrip = async (tripData: any) => {
    if (!tripData) {
      console.error('Cannot save empty trip data');
      return;
    }

    // Check if the trip is already saved to avoid duplicates
    const isUpdate = !!tripData.saved_trip_id;
    if (isUpdate) {
      console.log('Trip already saved with ID:', tripData.saved_trip_id);
      console.log('This will be an update operation rather than a new save');
    } else {
      console.log('This is a new trip save operation');
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      
      console.log(`${isUpdate ? 'Updating' : 'Saving new'} trip to Supabase...`);
      
      // Send itinerary to the save-trip API endpoint
      const response = await fetch('/api/save-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      });
      
      const responseText = await response.text();
      console.log('API Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse API response as JSON:', jsonError);
        throw new Error(`Invalid API response: ${responseText.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        console.error('API error response:', result);
        throw new Error(result.error || `Failed to save trip: ${response.status}`);
      }
      
      if (!result.success || !result.tripId) {
        console.error('Unexpected API response format:', result);
        throw new Error('Invalid response format from server');
      }
      
      console.log('Trip automatically saved successfully', result);
      
      // Store the trip ID in the itinerary object and update localStorage
      const updatedItinerary = {
        ...tripData,
        saved_trip_id: result.tripId
      };
      
      // Update state and localStorage
      setItinerary(updatedItinerary);
      localStorage.setItem('generatedItinerary', JSON.stringify(updatedItinerary));
      
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error auto-saving trip:', error);
      setSaveError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Try to get the itinerary from localStorage
    try {
      console.log('Attempting to load itinerary from localStorage...');
      const savedItinerary = localStorage.getItem('generatedItinerary');
      
      // Check if we're on a mobile device
      const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        console.log('Mobile device detected, using additional validation');
      }
      
      if (!savedItinerary) {
        console.log('No itinerary found in localStorage');
        router.push('/trips/new');
        return;
      }
      
      console.log('Found itinerary in localStorage');
      
      // Length check - if too short, it's likely corrupted
      if (savedItinerary.length < 100) {
        console.error('Itinerary data too short, likely corrupted');
        localStorage.removeItem('generatedItinerary'); // Clear corrupt data
        router.push('/trips/new');
        return;
      }
      
      console.log('First 100 characters:', savedItinerary.substring(0, 100));
      console.log('Last 100 characters:', savedItinerary.substring(savedItinerary.length - 100));
      
      // Check if it's valid JSON format
      const jsonCheck = savedItinerary.trim();
      const startsWithBrace = jsonCheck.startsWith('{');
      const endsWithBrace = jsonCheck.endsWith('}');
      
      console.log('JSON validation check - starts with {:', startsWithBrace, ', ends with }:', endsWithBrace);
      
      if (!startsWithBrace || !endsWithBrace) {
        console.error('Itinerary data not valid JSON format');
        localStorage.removeItem('generatedItinerary'); // Clear invalid data
        router.push('/trips/new');
        return;
      }
      
      try {
        const parsedItinerary = JSON.parse(savedItinerary);
        console.log('Successfully parsed itinerary from localStorage');
        
        // Validate essential data structure
        if (!parsedItinerary || typeof parsedItinerary !== 'object') {
          throw new Error('Parsed itinerary is not an object');
        }
        
        console.log('Itinerary structure:', Object.keys(parsedItinerary).join(', '));
        
        // Check for expected structure
        if (!parsedItinerary.days) {
          console.error('Missing days array in parsed itinerary');
          localStorage.removeItem('generatedItinerary'); // Clear invalid data
          router.push('/trips/new');
          return;
        } 
        
        if (!Array.isArray(parsedItinerary.days)) {
          console.error('Days property exists but is not an array:', typeof parsedItinerary.days);
          localStorage.removeItem('generatedItinerary'); // Clear invalid data
          router.push('/trips/new');
          return;
        } 
        
        if (parsedItinerary.days.length === 0) {
          console.error('Days array is empty');
          localStorage.removeItem('generatedItinerary'); // Clear invalid data
          router.push('/trips/new');
          return;
        }
        
        // Verify dates are present
        if (!parsedItinerary.dates && (!parsedItinerary.startDate || !parsedItinerary.endDate)) {
          console.error('Missing date information in parsed itinerary');
          // Try to reconstruct from days if available
          if (parsedItinerary.days[0]?.date && parsedItinerary.days[parsedItinerary.days.length-1]?.date) {
            parsedItinerary.dates = {
              start: parsedItinerary.days[0].date,
              end: parsedItinerary.days[parsedItinerary.days.length-1].date
            };
            parsedItinerary.startDate = parsedItinerary.days[0].date;
            parsedItinerary.endDate = parsedItinerary.days[parsedItinerary.days.length-1].date;
            console.log('Reconstructed missing dates from day data');
          } else {
            console.error('Cannot reconstruct dates, itinerary invalid');
            localStorage.removeItem('generatedItinerary');
            router.push('/trips/new');
            return;
          }
        }
        
        console.log(`Successfully loaded itinerary with ${parsedItinerary.days.length} days`);
        
        // Log the structure of the first day to help diagnose issues
        if (parsedItinerary.days[0]) {
          console.log('First day structure:', Object.keys(parsedItinerary.days[0]).join(', '));
          console.log('First day has activities:', Array.isArray(parsedItinerary.days[0].activities), 
            parsedItinerary.days[0].activities ? parsedItinerary.days[0].activities.length : 0);
          
          // Debug coordinates specifically
          if (parsedItinerary.days[0].activities && parsedItinerary.days[0].activities.length > 0) {
            const firstActivity = parsedItinerary.days[0].activities[0];
            console.log('First activity properties:', Object.keys(firstActivity).join(', '));
            console.log('First activity coordinates exists:', !!firstActivity.coordinates);
            if (firstActivity.coordinates) {
              console.log('Coordinates type:', typeof firstActivity.coordinates);
              console.log('Coordinates structure:', JSON.stringify(firstActivity.coordinates));
              console.log('Coordinates lat/lng values:', 
                firstActivity.coordinates.lat, 
                firstActivity.coordinates.lng);
              console.log('Are lat/lng valid numbers:', 
                !isNaN(Number(firstActivity.coordinates.lat)) && isFinite(Number(firstActivity.coordinates.lat)),
                !isNaN(Number(firstActivity.coordinates.lng)) && isFinite(Number(firstActivity.coordinates.lng))
              );
            }
          }
        }
        
        // If necessary fields are missing, try to repair
        if (!parsedItinerary.title && !parsedItinerary.tripName) {
          parsedItinerary.title = parsedItinerary.destination ? 
            `Trip to ${parsedItinerary.destination}` : 'My Trip';
          parsedItinerary.tripName = parsedItinerary.title;
          console.log('Added missing title/tripName:', parsedItinerary.title);
        }
        
        // Apply validation and structure fixes
        const validatedItinerary = ensureValidCoordinates(parsedItinerary);
        
        // Save the validated itinerary back to localStorage
        localStorage.setItem('generatedItinerary', JSON.stringify(validatedItinerary));
        console.log('Saved validated itinerary back to localStorage');
        
        setItinerary(validatedItinerary);
        
        // Only save to Supabase if it hasn't been saved already
        if (!validatedItinerary.saved_trip_id) {
          console.log('No saved_trip_id found, saving to Supabase');
          saveTrip(validatedItinerary);
        } else {
          console.log('Trip already has saved_trip_id, skipping save:', validatedItinerary.saved_trip_id);
        }
        
      } catch (parseError) {
        console.error('Error parsing itinerary JSON:', parseError);
        // Clear the invalid data
        localStorage.removeItem('generatedItinerary');
        router.push('/trips/new');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Try to safely clear the problematic data
      try {
        localStorage.removeItem('generatedItinerary');
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError);
      }
      router.push('/trips/new');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Handler for edit button
  const handleEditTrip = () => {
    router.push('/trips/new'); // Redirect back to the survey form
  };

  // Handler for share button (simplified demo)
  const handleShareTrip = () => {
    alert('Sharing functionality would be implemented here in a real application.');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  // If no itinerary is found, redirect to create a new one
  if (!itinerary) {
    // Use useEffect to handle the redirect
    useEffect(() => {
      router.push('/trips/new');
    }, [router]);
    
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">No itinerary found. Redirecting to create a new itinerary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          {saveSuccess && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-md">
              Trip auto-saved successfully!
            </div>
          )}
          {saveError && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md">
              {saveError}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleEditTrip}
            className="bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 flex items-center gap-1"
          >
            <FaEdit /> <span>Edit Trip</span>
          </button>
          <button 
            onClick={handleShareTrip}
            className="bg-accent text-white py-2 px-4 rounded-md hover:bg-opacity-90 flex items-center gap-1"
          >
            <FaShare /> <span>Share</span>
          </button>
        </div>
      </div>

      {/* Tabs - Calendar, Map, Budget Views with Suspense */}
      <Suspense fallback={<ComponentLoader />}>
        <ItineraryTabs 
          days={itinerary.days} 
          budget={normalizedBudget}
          title={itinerary.title || itinerary.tripName} 
          summary={itinerary.summary}
          travelTips={itinerary.travelTips}
        />
      </Suspense>
      
      {/* Booking Services with Suspense */}
      <div className="mt-10">
        <Suspense fallback={<ComponentLoader />}>
          <BookingServices 
            destination={itinerary.destination}
            startDate={itinerary.dates.start}
            endDate={itinerary.dates.end}
            accommodation={itinerary.days[0]?.accommodation}
            allAccommodations={itinerary.days
              .map((day: { accommodation?: any; date?: string }, index: number) => {
                if (day.accommodation) {
                  // Add the day information to the accommodation object
                  return {
                    ...day.accommodation,
                    // If not already set, determine check-in/check-out status
                    checkInOut: day.accommodation.checkInOut || 
                      (index === 0 ? 'check-in' : 
                       index === itinerary.days.length - 1 ? 'check-out' : 'staying')
                  };
                }
                return null;
              })
              .filter(Boolean)}
            budget={itinerary.budgetLevel || 'moderate'}
          />
        </Suspense>
      </div>
    </div>
  );
} 