import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { createLogger } from '../../../lib/logger';
import { supabaseAuth } from '../../../lib/auth';

// Initialize logger
const logger = createLogger('user-trips-api');

// Configure runtime for serverless function
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Try to get user ID if user is authenticated
    let userId = null;
    
    try {
      // Get auth header from request
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader) {
        logger.info('No Authorization header provided');
        return NextResponse.json({ trips: [] });
      }
      
      if (!authHeader.startsWith('Bearer ')) {
        logger.info('Authorization header does not start with Bearer');
        return NextResponse.json({ trips: [] });
      }
      
      const token = authHeader.split(' ')[1];
      
      if (!token) {
        logger.info('No token found in Authorization header');
        return NextResponse.json({ trips: [] });
      }
      
      logger.info('Attempting to verify token');
      
      // Verify the token and get user
      const { data, error } = await supabaseAuth.auth.getUser(token);
      
      if (error) {
        logger.error('Error verifying token:', error);
        return NextResponse.json({ trips: [] });
      }
      
      if (!data?.user) {
        logger.info('Token valid but no user data found');
        return NextResponse.json({ trips: [] });
      }
      
      userId = data.user.id;
      logger.info(`User authenticated with ID: ${userId}`);
    } catch (authError) {
      logger.error('Error verifying authentication:', authError);
      // Return empty trips array for auth errors
      return NextResponse.json({ trips: [] });
    }
    
    // User is authenticated, get their trips
    if (userId) {
      logger.info(`Fetching trips for user ${userId}`);
      
      const { data: trips, error } = await supabase
        .from('trips')
        .select('id, trip_data, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('Error fetching user trips:', error);
        return NextResponse.json(
          { error: 'Failed to fetch trips' },
          { status: 500 }
        );
      }
      
      if (!trips || trips.length === 0) {
        logger.info(`No trips found for user ${userId}`);
        return NextResponse.json({ trips: [] });
      }
      
      // Process trips to extract key information for the listing
      const processedTrips = trips.map(trip => {
        const tripData = trip.trip_data;
        
        return {
          id: trip.id,
          title: tripData.title || tripData.tripName || 'Untitled Trip',
          destination: tripData.destination || 'Unknown Destination',
          dates: {
            start: tripData.startDate || tripData.dates?.start || null,
            end: tripData.endDate || tripData.dates?.end || null,
          },
          days: tripData.days ? tripData.days.length : 0,
          created_at: trip.created_at,
          updated_at: trip.updated_at
        };
      });
      
      logger.info(`Returning ${processedTrips.length} trips for user ${userId}`);
      return NextResponse.json({ trips: processedTrips });
    }
    
    // Return empty trips array as fallback
    logger.info('No user ID available, returning empty trips array');
    return NextResponse.json({ trips: [] });
    
  } catch (error: any) {
    logger.error('Error in user-trips handler:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 