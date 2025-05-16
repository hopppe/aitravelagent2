import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { createLogger } from '../../../lib/logger';
import { cookies } from 'next/headers';
import { supabaseAuth, getCurrentUser } from '../../../lib/auth';

// Initialize logger
const logger = createLogger('save-trip-api');

// Configure runtime for serverless function
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const tripData = await request.json();
    
    if (!tripData) {
      logger.error('Missing trip data in request');
      return NextResponse.json(
        { error: 'Missing trip data' },
        { status: 400 }
      );
    }
    
    logger.info('Received trip data to save', { 
      has_id: !!tripData.saved_trip_id,
      size: JSON.stringify(tripData).length
    });

    // Verify Supabase is configured properly
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.error('Supabase environment variables are not configured properly');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

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
      }
    } catch (authError) {
      logger.error('Error verifying authentication:', authError);
    }
    
    // Extract prompt if available
    const prompt = tripData.prompt || null;
    
    // Check if the trip already has a saved id
    if (tripData.saved_trip_id) {
      logger.info(`Trip already has ID ${tripData.saved_trip_id}, updating instead of inserting`);
      
      // Verify that the trip with this ID exists before updating
      const { data: existingTrip, error: findError } = await supabase
        .from('trips')
        .select('id')
        .eq('id', tripData.saved_trip_id)
        .single();
        
      if (findError || !existingTrip) {
        logger.warn(`Trip with ID ${tripData.saved_trip_id} not found, will create a new trip instead`);
        // If trip doesn't exist, create a new one instead of updating
        tripData.saved_trip_id = null; // Clear the ID to trigger a new trip creation
      } else {
        logger.info(`Found existing trip with ID ${tripData.saved_trip_id}, proceeding with update`);
        
        const updateData: any = {
          trip_data: tripData,
          prompt: prompt,
          updated_at: new Date().toISOString()
        };
        
        // If we have a user ID, add it to the update
        if (userId) {
          updateData.user_id = userId;
        }
        
        // Update existing trip
        const { error: updateError } = await supabase
          .from('trips')
          .update(updateData)
          .eq('id', tripData.saved_trip_id);
        
        if (updateError) {
          logger.error('Failed to update trip:', updateError);
          logger.error('Error details:', {
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
            message: updateError.message
          });
          return NextResponse.json(
            { error: `Failed to update trip: ${updateError.message}` },
            { status: 500 }
          );
        }
        
        logger.info(`Trip updated successfully with ID: ${tripData.saved_trip_id}`);
        
        return NextResponse.json({ 
          success: true, 
          tripId: tripData.saved_trip_id
        });
      }
    }
    
    // Generate a unique ID for the trip with more entropy
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
    const tripId = `trip_${timestamp}_${random}`;
    
    logger.info(`Creating new trip with generated ID: ${tripId}`);
    
    // Prepare data for insertion
    const insertData: any = {
      id: tripId,
      trip_data: tripData,
      prompt: prompt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // If we have a user ID, add it to the insert
    if (userId) {
      insertData.user_id = userId;
      logger.info(`Associating trip with user ID: ${userId}`);
    } else {
      logger.info('No user ID available, creating anonymous trip');
    }
    
    // Test Supabase connection before trying to insert
    try {
      const { data: testData, error: testError } = await supabase.from('trips').select('count(*)').limit(1);
      if (testError) {
        logger.error('Supabase connection test failed:', testError);
      } else {
        logger.info('Supabase connection test successful');
      }
    } catch (testErr) {
      logger.error('Error testing Supabase connection:', testErr);
    }
    
    // Insert new trip
    const { error } = await supabase
      .from('trips')
      .insert(insertData);
    
    if (error) {
      logger.error('Failed to save trip:', error);
      logger.error('Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      
      // Try to check if the table exists
      const { count, error: checkError } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true });
      
      if (checkError) {
        logger.error('Table check failed, trips table might not exist:', checkError);
        
        // Create the table if it doesn't exist
        try {
          const createQuery = `
            CREATE TABLE IF NOT EXISTS public.trips (
              id TEXT PRIMARY KEY,
              trip_data JSONB NOT NULL,
              prompt TEXT,
              user_id UUID REFERENCES auth.users(id),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          
          const { error: createError } = await supabase.rpc('execute_sql', { sql: createQuery });
          
          if (createError) {
            logger.error('Failed to create trips table:', createError);
          } else {
            logger.info('Created trips table successfully');
            
            // Try inserting again
            const { error: retryError } = await supabase
              .from('trips')
              .insert(insertData);
            
            if (retryError) {
              logger.error('Failed on retry after table creation:', retryError);
              return NextResponse.json(
                { error: 'Failed to save trip to database' },
                { status: 500 }
              );
            } else {
              logger.info(`Trip saved successfully with ID: ${tripId} after table creation`);
              return NextResponse.json({ 
                success: true, 
                tripId: tripId
              });
            }
          }
        } catch (sqlError) {
          logger.error('SQL error creating table:', sqlError);
        }
      }
      
      return NextResponse.json(
        { error: `Failed to save trip to database: ${error.message}` },
        { status: 500 }
      );
    }
    
    logger.info(`Trip saved successfully with ID: ${tripId}`);
    
    return NextResponse.json({ 
      success: true, 
      tripId: tripId
    });
    
  } catch (error: any) {
    logger.error('Error in save-trip handler:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 