import { getServerConfig } from '../utils/config';

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number; // 0 (Free) to 4 (Very Expensive)
  photos?: string[];
  types?: string[];
  url?: string;
  website?: string;
  formattedPhone?: string;
}

/**
 * Search for places using Google Places API Nearby Search
 * Documentation: https://developers.google.com/maps/documentation/places/web-service/search-nearby
 * 
 * @param keyword The keyword to search for (optional)
 * @param location The location to search around (lat, lng)
 * @param radius The search radius in meters
 * @param type The place type to search for (e.g., 'lodging')
 * @param minPriceLevel The minimum price level (0-4)
 * @param maxPriceLevel The maximum price level (0-4)
 * @returns Promise<PlaceResult[]>
 */
export async function searchPlaces(
  keyword: string,
  location: { lat: number; lng: number },
  radius: number = 5000,
  type: string = 'lodging',
  minPriceLevel?: number,
  maxPriceLevel?: number
): Promise<PlaceResult[]> {
  console.log(`[Google Places] Searching for places at ${location.lat},${location.lng}`);
  
  try {
    // Using URLSearchParams to properly encode all parameters
    const params = new URLSearchParams();
    
    // Add required and optional parameters
    params.append('endpoint', 'nearbysearch');
    params.append('location', `${location.lat},${location.lng}`);
    params.append('radius', radius.toString());
    
    if (type) {
      params.append('type', type);
    }
    
    if (keyword) {
      params.append('keyword', keyword);
    }

    if (minPriceLevel !== undefined) {
      params.append('minprice', minPriceLevel.toString());
    }

    if (maxPriceLevel !== undefined) {
      params.append('maxprice', maxPriceLevel.toString());
    }
    
    // Build the URL
    const url = `/api/places/proxy?${params.toString()}`;
    
    // Log the full request URL for debugging
    console.log(`[Google Places] Request URL: ${url}`);
    
    // Make the request through our proxy API
    const response = await fetch(url, { 
      // Add this option to make fetch work with relative URLs on the server
      headers: { 'x-url-base': 'http://localhost:3000' } 
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Google Places] API error (${response.status}): ${errorText}`);
      throw new Error(`Places API proxy error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`[Google Places] API returned error status: ${data.status}`);
      console.error(`[Google Places] Error message: ${data.error_message || 'Unknown error'}`);
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
    if (!data.results || !Array.isArray(data.results)) {
      console.error('[Google Places] No results array in response', data);
      return [];
    }
    
    console.log(`[Google Places] Found ${data.results.length} places`);
    
    // Transform the results into our standardized format
    const results = data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity || place.formatted_address || 'Address not available',
      location: {
        lat: place.geometry?.location?.lat || location.lat,
        lng: place.geometry?.location?.lng || location.lng,
      },
      rating: place.rating || 0,
      userRatingsTotal: place.user_ratings_total || 0,
      priceLevel: place.price_level,
      photos: place.photos?.map((photo: any) => {
        // Create properly encoded photo URL
        const photoParams = new URLSearchParams();
        photoParams.append('photo_reference', photo.photo_reference);
        photoParams.append('maxwidth', '400');
        return `/api/places/photo?${photoParams.toString()}`;
      }) || [],
      types: place.types || [],
      url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    }));
    
    console.log(`[Google Places] Processed ${results.length} results`);
    return results;
  } catch (error) {
    console.error('[Google Places] Error fetching places:', error);
    return [];
  }
}

/**
 * Maps budget levels to Google Place API price levels
 * @param budgetLevel 'budget' | 'moderate' | 'luxury' | string
 * @returns {min: number, max: number} - Price level range (0-4)
 */
export function mapBudgetToPriceLevel(budgetLevel: string): { min: number, max: number } {
  switch (budgetLevel?.toLowerCase()) {
    case 'budget':
    case 'low':
    case 'cheap':
      return { min: 0, max: 1 };
    case 'moderate':
    case 'medium':
    case 'mid-range':
      return { min: 1, max: 2 };
    case 'luxury':
    case 'high':
    case 'expensive':
      return { min: 3, max: 4 };
    default:
      return { min: 0, max: 4 }; // Default to all price ranges
  }
}

/**
 * Get formatted price level text
 * @param priceLevel 0-4 price level
 * @returns string description of price level
 */
export function getPriceLevelText(priceLevel?: number): string {
  switch (priceLevel) {
    case 0:
      return 'Free';
    case 1:
      return 'Inexpensive';
    case 2:
      return 'Moderate';
    case 3:
      return 'Expensive';
    case 4:
      return 'Very Expensive';
    default:
      return 'Price not available';
  }
} 