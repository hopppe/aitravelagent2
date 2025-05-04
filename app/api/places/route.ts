import { NextRequest, NextResponse } from 'next/server';
import { mapBudgetToPriceLevel } from '../../../lib/google-places';
import { getServerConfig } from '../../../utils/config';

// Define types for the Google Places API v1 request
type PriceLevel = 'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE';

interface PlacesRequestBody {
  textQuery: string;
  languageCode: string;
  locationBias: {
    circle: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    }
  };
  includedType: string;
  priceLevels: PriceLevel[];
}

/**
 * API route for fetching nearby accommodation options using Google Places API v1
 * Documentation: https://developers.google.com/maps/documentation/places/web-service/search-text
 */
export async function GET(request: NextRequest) {
  // Set CORS headers to allow the request from the client
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword') || '';
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radius = parseInt(searchParams.get('radius') || '5000', 10);
  const type = searchParams.get('type') || 'lodging';
  const budget = searchParams.get('budget') || 'moderate';
  
  console.log('[Places API] Received request:');
  console.log(`[Places API] Keyword: "${keyword}", Location: ${lat},${lng}, Budget: ${budget}, Radius: ${radius}m`);
  
  // Validate required parameters
  if (lat === 0 || lng === 0) {
    console.error('[Places API] Missing required location parameters');
    return NextResponse.json(
      { error: 'Missing required parameters: lat, lng' },
      { status: 400, headers }
    );
  }
  
  try {
    // Map budget string to price level range
    const { min: minPriceLevel, max: maxPriceLevel } = mapBudgetToPriceLevel(budget);
    console.log(`[Places API] Budget ${budget} mapped to price levels: ${minPriceLevel}-${maxPriceLevel}`);
    
    // Get API key from server config
    const { googleMapsApiKey } = getServerConfig();
    
    if (!googleMapsApiKey) {
      console.error('[Places API] Google Maps API key is not configured');
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500, headers }
      );
    }
    
    // Construct the text query for the Places API v1
    let textQuery = '';
    
    if (keyword) {
      // If we have a specific destination keyword, use it
      textQuery = keyword.includes('hotel') || keyword.includes('lodging') 
        ? keyword 
        : `${keyword} hotels`;
    } else {
      // Otherwise just search for hotels near the coordinates
      textQuery = `hotels near ${lat},${lng}`;
    }
    
    // Build the request body for the Places API v1
    const requestBody: PlacesRequestBody = {
      textQuery: textQuery,
      languageCode: 'en',
      locationBias: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng
          },
          radius: radius
        }
      },
      includedType: 'lodging',
      priceLevels: []
    };
    
    // Add price levels if specified
    for (let i = minPriceLevel; i <= maxPriceLevel; i++) {
      if (i >= 0 && i <= 4) {
        // Map to the enum values used by Google Places API v1
        const priceLevel = ['PRICE_LEVEL_FREE', 'PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE'][i];
        requestBody.priceLevels.push(priceLevel as PriceLevel);
      }
    }
    
    // New Places API v1 endpoint
    const apiUrl = 'https://places.googleapis.com/v1/places:searchText';
    
    // Field mask for the response - only request the fields we need
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.rating',
      'places.userRatingCount',
      'places.priceLevel',
      'places.photos',
      'places.types',
      'places.websiteUri'
    ].join(',');
    
    console.log(`[Places API] Making request to Places API v1 with query: "${textQuery}"`);
    
    // Make the request to the Places API v1
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleMapsApiKey,
        'X-Goog-FieldMask': fieldMask,
        'Accept': 'application/json',
        'User-Agent': 'AI Travel Agent/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Places API] Error ${response.status}: ${errorText}`);
      throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log(`[Places API] Found ${data.places?.length || 0} places`);
    
    // If no places were found, return an empty array
    if (!data.places || data.places.length === 0) {
      console.log('[Places API] No results found');
      return NextResponse.json({ places: [] }, { headers });
    }
    
    // Transform the results to our standardized format
    const places = data.places.map((place: any) => ({
      id: place.id,
      name: place.displayName?.text || 'Unnamed Place',
      address: place.formattedAddress || 'Address not available',
      location: {
        lat: place.location?.latitude || lat,
        lng: place.location?.longitude || lng,
      },
      rating: place.rating || 0,
      userRatingsTotal: place.userRatingCount || 0,
      priceLevel: mapGooglePriceLevelToNumeric(place.priceLevel),
      photos: place.photos?.map((photo: any) => {
        // Create properly encoded photo URL for the v1 API
        // The photo reference format is the full path to the photo
        const photoReference = photo.name;
        const photoParams = new URLSearchParams();
        photoParams.append('photo_reference', photoReference);
        photoParams.append('maxwidth', '400');
        return `/api/places/photo?${photoParams.toString()}`;
      }) || [],
      types: place.types?.map((type: any) => type.replace('TYPE_', '').toLowerCase()) || [],
      url: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
      website: place.websiteUri || null
    }));
    
    // Return the results with CORS headers
    return NextResponse.json({ places }, { headers });
  } catch (error) {
    console.error('[Places API] Error:', error);
    return NextResponse.json(
      { error: 'Error fetching places', details: (error as Error).message },
      { status: 500, headers }
    );
  }
}

/**
 * Maps Google Places API v1 price level enum to numeric value (0-4)
 */
function mapGooglePriceLevelToNumeric(priceLevel: string | undefined): number | undefined {
  if (!priceLevel) return undefined;
  
  const priceLevelMap: { [key: string]: number } = {
    'PRICE_LEVEL_FREE': 0,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4
  };
  
  return priceLevelMap[priceLevel];
} 