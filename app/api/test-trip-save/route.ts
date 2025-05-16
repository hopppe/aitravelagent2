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
        
      console.log('Successfully parsed trip data with structure:', Object.keys(trip).join(', '));
      console.log(`Trip has ${trip.days?.length || 0} days`);
    } catch (parseError) {
      console.error('Error parsing trip_data JSON:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse trip data',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Make a trivial change to verify we can update properly
    // Just append " - Verified" to the trip title
    trip.title = trip.title + " - Verified";
    console.log('Updated trip title to:', trip.title);
    
    // Make a clone of the trip data to avoid any reference issues
    const updatedTrip = JSON.parse(JSON.stringify(trip));
    
    // Save the updated trip back to Supabase
    console.log('Saving updated trip to Supabase...');
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        trip_data: JSON.stringify(updatedTrip),
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId);
    
    if (updateError) {
      console.error('Error updating trip:', updateError);
      return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
    }
    
    console.log('Successfully updated trip');
    
    return NextResponse.json({
      success: true,
      message: 'Trip updated successfully',
      tripStructure: Object.keys(trip),
      dayStructure: trip.days && trip.days.length > 0 ? Object.keys(trip.days[0]) : [],
      updatedTitle: trip.title
    });
    
  } catch (error) {
    console.error('Error in test-trip-save API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 