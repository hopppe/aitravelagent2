import { NextResponse } from 'next/server';
import { getServerConfig } from '../../../utils/config';

/**
 * API route that generates a Google Maps URL with the API key from the server
 * This prevents exposing the API key in client-side code
 */
export async function GET() {
  try {
    // Get the API key from server-side configuration
    const { googleMapsApiKey } = getServerConfig();
    
    if (!googleMapsApiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured on the server' },
        { status: 500 }
      );
    }
    
    // Return the Google Maps API URL with the key
    const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    
    return NextResponse.json({ url: mapsUrl });
  } catch (error) {
    console.error('Error generating Google Maps URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate Google Maps URL' },
      { status: 500 }
    );
  }
} 