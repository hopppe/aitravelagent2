import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { createLogger } from '../../../../lib/logger';
import { supabaseAuth } from '../../../../lib/auth';

// Initialize logger
const logger = createLogger('trip-details-api');

// Configure runtime for serverless function
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id;
    
    if (!tripId) {
      logger.error('Missing trip ID in request');
      return NextResponse.json(
        { error: 'Missing trip ID' },
        { status: 400 }
      );
    }
    
    logger.info(`Fetching trip with ID: ${tripId}`);
    
    // Get user ID from auth header if available
    let userId = null;
    try {
      // Get auth header from request
      const authHeader = request.headers.get('Authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        logger.info('Authentication token provided, verifying...');
        
        // Verify the token and get user
        const { data, error } = await supabaseAuth.auth.getUser(token);
        
        if (error) {
          logger.warn(`Token verification error: ${error.message}`);
        } else if (data?.user) {
          userId = data.user.id;
          logger.info(`User authenticated with ID: ${userId}`);
        } else {
          logger.warn('Token verified but no user data found');
        }
      } else {
        logger.info('No authentication token provided, proceeding with public access');
      }
    } catch (authError) {
      logger.error('Error verifying authentication:', authError);
    }
    
    // Fetch the trip from Supabase
    logger.info(`Querying database for trip ID: ${tripId}`);
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();
    
    if (error) {
      logger.error(`Error fetching trip: ${error.message}`);
      return NextResponse.json(
        { error: 'Failed to fetch trip' },
        { status: 500 }
      );
    }
    
    if (!trip) {
      logger.error(`Trip with ID ${tripId} not found`);
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }
    
    // Authorization check
    if (trip.user_id) {
      logger.info(`Trip belongs to user: ${trip.user_id}`);
      
      // If the trip has a user_id and it doesn't match the current user, deny access
      if (userId !== trip.user_id) {
        logger.warn(`Access denied: User ${userId || 'anonymous'} attempted to access trip ${tripId} owned by ${trip.user_id}`);
        return NextResponse.json(
          { error: 'You do not have permission to access this trip' },
          { status: 403 }
        );
      }
      
      logger.info(`Access granted: User ${userId} accessing their own trip`);
    } else {
      logger.info('Trip is anonymous (no user_id), allowing access');
    }
    
    logger.info(`Successfully fetched trip: ${tripId}`);
    
    return NextResponse.json({ trip });
    
  } catch (error: any) {
    logger.error(`Error in trip details handler: ${error.message}`);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 