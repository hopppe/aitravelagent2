'use client';

import React, { useState, useEffect } from 'react';
import { FaEdit, FaShare } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import ItineraryTabs from '../../../components/trips/ItineraryTabs';
import BookingServices from '../../../components/trips/BookingServices';
import useBudgetCalculator from '../../../hooks/useBudgetCalculator';

// Helper function to ensure valid coordinates and data structure
function ensureValidCoordinates(itinerary: any) {
  if (!itinerary || !itinerary.days || !Array.isArray(itinerary.days)) {
    return itinerary;
  }
  
  console.log('Validating itinerary data structure...');
  let issuesFixed = 0;
  
  // Ensure budget exists and has proper structure
  if (!itinerary.budget || typeof itinerary.budget !== 'object') {
    console.log('Missing budget object, creating default budget');
    itinerary.budget = {
      accommodation: 0,
      food: 0,
      activities: 0,
      transport: 0,
      total: 0
    };
    issuesFixed++;
  } else {
    // Calculate budget from activities if necessary
    let totalActivitiesCost = 0;
    
    // Ensure all budget properties exist with defaults
    if (itinerary.budget.accommodation === undefined) {
      console.log('Missing budget.accommodation, defaulting to 0');
      itinerary.budget.accommodation = 0;
      issuesFixed++;
    }
    
    if (itinerary.budget.food === undefined) {
      console.log('Missing budget.food, defaulting to 0');
      itinerary.budget.food = 0;
      issuesFixed++;
    }
    
    // Handle both transportation and transport field names
    if (itinerary.budget.transportation !== undefined && itinerary.budget.transport === undefined) {
      console.log('Converting "transportation" field to "transport" for consistency');
      itinerary.budget.transport = itinerary.budget.transportation;
    } else if (itinerary.budget.transport === undefined) {
      console.log('Missing budget.transport, defaulting to 0');
      itinerary.budget.transport = 0;
      issuesFixed++;
    }
    
    // Calculate activities cost from actual activities if needed
    if (itinerary.budget.activities === undefined) {
      console.log('Missing budget.activities, calculating from activity costs');
      
      // Sum up all activity costs
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
      issuesFixed++;
    }
    
    // Ensure total is present and accurate
    const calculatedTotal = 
      itinerary.budget.accommodation + 
      itinerary.budget.food + 
      itinerary.budget.activities + 
      itinerary.budget.transport;
    
    if (itinerary.budget.total === undefined || itinerary.budget.total !== calculatedTotal) {
      console.log(`${itinerary.budget.total === undefined ? 'Missing' : 'Incorrect'} budget.total, updating to calculated total: ${calculatedTotal}`);
      itinerary.budget.total = calculatedTotal;
      issuesFixed++;
    }
  }
  
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

export default function GeneratedTripPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use our budget calculator hook to get normalized budget values
  const normalizedBudget = useBudgetCalculator(itinerary);

  useEffect(() => {
    // Try to get the itinerary from localStorage
    try {
      console.log('Attempting to load itinerary from localStorage...');
      const savedItinerary = localStorage.getItem('generatedItinerary');
      
      if (savedItinerary) {
        console.log('Found itinerary in localStorage');
        console.log('First 100 characters:', savedItinerary.substring(0, 100));
        console.log('Last 100 characters:', savedItinerary.substring(savedItinerary.length - 100));
        
        // Check if it's valid JSON format
        const jsonCheck = savedItinerary.trim();
        const startsWithBrace = jsonCheck.startsWith('{');
        const endsWithBrace = jsonCheck.endsWith('}');
        
        console.log('JSON validation check - starts with {:', startsWithBrace, ', ends with }:', endsWithBrace);
        
        try {
          const parsedItinerary = JSON.parse(savedItinerary);
          console.log('Successfully parsed itinerary from localStorage');
          console.log('Itinerary structure:', Object.keys(parsedItinerary).join(', '));
          
          // Check for expected structure
          if (!parsedItinerary.days) {
            console.error('Missing days array in parsed itinerary');
            // Redirect user to create a new itinerary
            router.push('/trips/new');
          } else if (!Array.isArray(parsedItinerary.days)) {
            console.error('Days property exists but is not an array:', typeof parsedItinerary.days);
            // Redirect user to create a new itinerary
            router.push('/trips/new');
          } else if (parsedItinerary.days.length === 0) {
            console.error('Days array is empty');
            // Redirect user to create a new itinerary
            router.push('/trips/new');
          } else {
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
            setItinerary(ensureValidCoordinates(parsedItinerary));
          }
        } catch (parseError) {
          console.error('Error parsing itinerary JSON:', parseError);
          // Redirect user to create a new itinerary
          router.push('/trips/new');
        }
      } else {
        console.log('No itinerary found in localStorage');
        // Redirect user to create a new itinerary
        router.push('/trips/new');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Redirect user to create a new itinerary
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
        <div></div> {/* Empty div for flex spacing */}
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

      {/* Tabs - Calendar, Map, Budget Views */}
      <ItineraryTabs 
        days={itinerary.days} 
        budget={normalizedBudget}
        title={itinerary.title || itinerary.tripName} 
        summary={itinerary.summary}
        travelTips={itinerary.travelTips}
      />
      
      {/* Booking Services */}
      <div className="mt-10">
        <BookingServices 
          destination={itinerary.destination}
          startDate={itinerary.dates.start}
          endDate={itinerary.dates.end}
        />
      </div>
    </div>
  );
} 