import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '../../../../utils/config';

/**
 * Proxy API for Google Places API requests to avoid exposing the API key to the client
 * Based on https://developers.google.com/maps/documentation/places/web-service
 */
export async function GET(request: NextRequest) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const { googleMapsApiKey } = getServerConfig();
    
    if (!googleMapsApiKey) {
      console.error('Google Maps API key is not configured');
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500, headers }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint') || 'nearbysearch';
    
    // Log the incoming request
    console.log(`[Places API Proxy] Endpoint: ${endpoint}`);
    console.log(`[Places API Proxy] Parameters:`, Object.fromEntries(searchParams.entries()));
    
    // Create a new URLSearchParams for the Google Places API call
    const googleParams = new URLSearchParams();
    
    // Copy and properly encode all parameters
    searchParams.forEach((value, key) => {
      // Skip the endpoint parameter
      if (key !== 'endpoint') {
        googleParams.append(key, value);
      }
    });
    
    // Add our API key
    googleParams.append('key', googleMapsApiKey);

    // Build the Google Places API URL according to the documentation
    // https://developers.google.com/maps/documentation/places/web-service/search-nearby
    const baseUrl = `https://maps.googleapis.com/maps/api/place/${endpoint}/json`;
    
    // For debugging, show the URL we're going to call (but hide the API key)
    const debugParams = new URLSearchParams(googleParams);
    debugParams.set('key', 'API_KEY_HIDDEN');
    console.log(`[Places API Proxy] Making request to: ${baseUrl}?${debugParams.toString()}`);
    
    // Make the request to Google Places API
    const response = await fetch(`${baseUrl}?${googleParams.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AI Travel Agent/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Places API Proxy] Error ${response.status}: ${errorText}`);
      throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log(`[Places API Proxy] Response status: ${data.status}`);
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`[Places API Proxy] API returned status: ${data.status}`, data.error_message);
    } else {
      console.log(`[Places API Proxy] Found ${data.results?.length || 0} results`);
    }
    
    // Return the results with CORS headers
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('Google Places API proxy error:', error);
    return NextResponse.json(
      { error: 'Error proxying request to Google Places API', details: (error as Error).message },
      { status: 500, headers }
    );
  }
} 