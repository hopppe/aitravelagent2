import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const tripId = url.searchParams.get('tripId');
    
    // Validate required fields
    if (!tripId) {
      console.error('Missing tripId in request');
      return NextResponse.json({ error: 'Missing tripId parameter' }, { status: 400 });
    }

    // Find the trip in Supabase
    console.log(`Fetching trip with ID: ${tripId} from Supabase`);
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();
    
    if (tripError || !tripData) {
      console.error('Error fetching trip:', tripError);
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    
    // Parse the trip data
    let trip;
    try {
      console.log('Trip data format:', typeof tripData.trip_data);
      
      trip = typeof tripData.trip_data === 'string'
        ? JSON.parse(tripData.trip_data)
        : tripData.trip_data;
        
      console.log('Successfully parsed trip data');
    } catch (parseError) {
      console.error('Error parsing trip_data JSON:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse trip data',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    const days = trip.days || [];
    console.log(`Trip has ${days.length} days`);
    
    // Extract all items with their titles
    interface TripItem {
      dayIndex: number;
      dayNumber: number;
      type: 'activity' | 'meal' | 'accommodation';
      title?: string;
      venue?: string;
      name?: string;
      displayName: string;
      description?: string;
    }
    
    const items: TripItem[] = [];
    
    days.forEach((day: any, dayIndex: number) => {
      // Use the day number from the day.day property if available
      const dayNumber = day.day || (dayIndex + 1);
      
      // Extract activities
      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach((activity: any) => {
          items.push({
            dayIndex,
            dayNumber,
            type: 'activity',
            title: activity.title,
            displayName: activity.title,
            description: activity.description
          });
        });
      }
      
      // Extract meals
      if (day.meals && Array.isArray(day.meals)) {
        day.meals.forEach((meal: any) => {
          const displayName = meal.venue || meal.title || meal.type;
          items.push({
            dayIndex,
            dayNumber,
            type: 'meal',
            venue: meal.venue,
            title: meal.title,
            displayName,
            description: meal.description
          });
        });
      }
      
      // Extract accommodation
      if (day.accommodation) {
        items.push({
          dayIndex,
          dayNumber,
          type: 'accommodation',
          name: day.accommodation.name,
          displayName: day.accommodation.name,
          description: day.accommodation.description
        });
      }
    });
    
    return NextResponse.json({
      success: true,
      items,
      totalItems: items.length,
      tripTitle: trip.title || trip.tripName
    });
    
  } catch (error) {
    console.error('Error in list-trip-items API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 