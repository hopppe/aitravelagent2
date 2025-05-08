import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { createLogger } from '../../../../lib/logger';
import { supabaseAuth } from '../../../../lib/auth';

// Initialize logger
const logger = createLogger('deduplicate-trips-api');

// Configure runtime for serverless function
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Try to get user ID if user is authenticated
    let userId = null;
    try {
      // Get auth header from request
      const authHeader = request.headers.get('Authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        // Verify the token and get user
        const { data, error } = await supabaseAuth.auth.getUser(token);
        
        if (!error && data?.user) {
          userId = data.user.id;
          logger.info(`User authenticated with ID: ${userId}`);
        }
      } else {
        logger.info('No authentication token provided');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    } catch (authError) {
      logger.error('Error verifying authentication:', authError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Get all trips for the user
    const { data: userTrips, error: fetchError } = await supabase
      .from('trips')
      .select('id, trip_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      logger.error('Error fetching user trips for deduplication:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch trips' },
        { status: 500 }
      );
    }
    
    if (!userTrips || userTrips.length < 2) {
      logger.info('No duplicate trips found (less than 2 trips)');
      return NextResponse.json({
        message: 'No duplicate trips found',
        deduplicatedCount: 0
      });
    }
    
    logger.info(`Found ${userTrips.length} trips for user ${userId}, analyzing for duplicates...`);
    
    // Create a map to group trips by destination and date
    const tripGroups: Record<string, any[]> = {};
    
    userTrips.forEach(trip => {
      const tripData = trip.trip_data;
      // Skip if trip data is invalid
      if (!tripData || !tripData.destination) return;
      
      // Create a key based on destination and dates to identify potential duplicates
      const dates = tripData.dates || {};
      const startDate = dates.start || tripData.startDate || 'unknown';
      const endDate = dates.end || tripData.endDate || 'unknown';
      
      const key = `${tripData.destination.toLowerCase()}_${startDate}_${endDate}`;
      
      if (!tripGroups[key]) {
        tripGroups[key] = [];
      }
      
      tripGroups[key].push({
        id: trip.id,
        created_at: trip.created_at,
        data: tripData
      });
    });
    
    // Find groups with more than one trip (duplicates)
    const duplicateGroups = Object.entries(tripGroups)
      .filter(([key, trips]) => trips.length > 1);
    
    if (duplicateGroups.length === 0) {
      logger.info('No duplicate trips found based on destination and dates');
      return NextResponse.json({
        message: 'No duplicate trips found',
        deduplicatedCount: 0
      });
    }
    
    logger.info(`Found ${duplicateGroups.length} groups of potential duplicate trips`);
    
    // IDs of trips to delete (keeping the most recent one in each group)
    const tripsToDelete: string[] = [];
    
    duplicateGroups.forEach(([key, trips]) => {
      // Sort trips by creation date, newest first
      trips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Keep the newest trip, mark others for deletion
      const [newest, ...duplicates] = trips;
      logger.info(`Keeping newest trip ${newest.id} and removing ${duplicates.length} duplicates`);
      
      // Add duplicate IDs to deletion list
      tripsToDelete.push(...duplicates.map(d => d.id));
    });
    
    // Delete duplicates if any were found
    if (tripsToDelete.length > 0) {
      logger.info(`Deleting ${tripsToDelete.length} duplicate trips`);
      
      const { error: deleteError } = await supabase
        .from('trips')
        .delete()
        .in('id', tripsToDelete);
      
      if (deleteError) {
        logger.error('Error deleting duplicate trips:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete duplicate trips' },
          { status: 500 }
        );
      }
      
      logger.info(`Successfully deleted ${tripsToDelete.length} duplicate trips`);
      
      return NextResponse.json({
        message: 'Successfully deduplicated trips',
        deduplicatedCount: tripsToDelete.length
      });
    }
    
    return NextResponse.json({
      message: 'No duplicate trips found',
      deduplicatedCount: 0
    });
    
  } catch (error: any) {
    logger.error('Error in deduplicate-trips handler:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 