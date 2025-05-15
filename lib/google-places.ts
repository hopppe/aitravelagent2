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
      return { min: 1, max: 1 }; // Only PRICE_LEVEL_INEXPENSIVE
    case 'moderate':
    case 'medium':
    case 'mid-range':
      return { min: 2, max: 2 }; // Only PRICE_LEVEL_MODERATE
    case 'luxury':
    case 'high':
    case 'expensive':
      return { min: 3, max: 3 }; // Only PRICE_LEVEL_EXPENSIVE
    default:
      // For unrecognized budget levels, or if no budget is specified by certain callers,
      // falling back to a broad range. Consider if this default is appropriate for all scenarios.
      console.warn(`[mapBudgetToPriceLevel] Unrecognized budgetLevel: "${budgetLevel}", defaulting to all price levels.`);
      return { min: 0, max: 4 }; 
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

// Google Places API v1 endpoints
const PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';
const PLACES_PHOTO_URL = 'https://places.googleapis.com/v1/photos';

// Don't check for env vars here - it will run on client
// Get API key when needed in the functions

// --- Types ---

export interface PlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions: string[];
}

interface TextSearchResult {
  places: { id: string }[];
}

interface PlaceDetailsResult {
  photos?: PlacePhoto[];
}

// --- Utility Functions ---

/**
 * Fetches the Google Place ID for a given destination name using Text Search.
 */
export async function getPlaceId(destination: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('[Google Places][getPlaceId] Missing GOOGLE_MAPS_API_KEY environment variable.');
    return null;
  }

  const requestBody = {
    textQuery: destination,
  };

  // console.log(`[Google Places][getPlaceId] Attempting to fetch placeId for destination: "${destination}" with body:`, JSON.stringify(requestBody, null, 2));

  try {
    const res = await fetch(PLACES_TEXT_SEARCH_URL, { // PLACES_TEXT_SEARCH_URL is 'https://places.googleapis.com/v1/places:searchText'
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id', // Corrected field mask for searchText to get the place ID
      } as HeadersInit,
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Google Places][getPlaceId] Error response from Text Search API for destination "${destination}". Status: ${res.status}, Response: ${errorText}`);
      return null;
    }

    const data = (await res.json()) as TextSearchResult; 
    // console.log(`[Google Places][getPlaceId] Raw Text Search API response for "${destination}":`, JSON.stringify(data, null, 2));

    if (data.places && data.places.length > 0 && data.places[0].id) {
      const placeId = data.places[0].id;
      // console.log(`[Google Places][getPlaceId] Successfully found placeId "${placeId}" for "${destination}".`);
      return placeId;
    } else {
      console.warn(`[Google Places][getPlaceId] No placeId found in Text Search API response for "${destination}".`);
      return null;
    }
  } catch (error) {
    console.error(`[Google Places][getPlaceId] Exception during Text Search API call for "${destination}":`, error);
    return null;
  }
}

/**
 * Fetches photo metadata for a place by place ID.
 */
export async function getPlacePhotoMetadata(placeId: string): Promise<PlacePhoto | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('[Google Places][getPlacePhotoMetadata] Missing GOOGLE_MAPS_API_KEY environment variable.');
    return null;
  }

  try {
    const url = `${PLACES_DETAILS_URL}/${placeId}`; // PLACES_DETAILS_URL is 'https://places.googleapis.com/v1/places'
    // console.log(`[Google Places][getPlacePhotoMetadata] Fetching photo metadata from: ${url} with field mask: photos`);
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'photos',
      } as HeadersInit,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Google Places][getPlacePhotoMetadata] Error fetching metadata for placeId '${placeId}'. Status: ${res.status}, Response: ${errorText}`);
      return null;
    }

    const data = (await res.json()) as PlaceDetailsResult;
    // console.log(`[Google Places][getPlacePhotoMetadata] Raw photo metadata response for placeId '${placeId}':`, JSON.stringify(data, null, 2));

    if (!data.photos || data.photos.length === 0) {
      // This is a common case (e.g. for cities/countries) and not necessarily an error, so using console.info or console.warn
      console.info(`[Google Places][getPlacePhotoMetadata] No photos array or empty photos array found for placeId '${placeId}'.`);
      return null;
    }
    
    // console.log(`[Google Places][getPlacePhotoMetadata] Found photo metadata for placeId '${placeId}':`, JSON.stringify(data.photos[0], null, 2));
    return data.photos[0];

  } catch (error) {
    console.error(`[Google Places][getPlacePhotoMetadata] Exception for placeId '${placeId}':`, error);
    return null;
  }
}

/**
 * Constructs a Google Place Photo URL from photo metadata.
 */
export function getPlacePhotoUrl(photoName: string, maxWidth: number = 800): string | null {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('[Google Places][getPlacePhotoUrl] Missing GOOGLE_MAPS_API_KEY environment variable.');
    return null;
  }
  
  if (!photoName) {
    console.error('[Google Places][getPlacePhotoUrl] Missing photoName argument.');
    return null;
  }
  
  try {
    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=${maxWidth}`;
    // console.log(`[Google Places][getPlacePhotoUrl] Constructed photo URL: ${photoUrl}`);
    return photoUrl;
  } catch (error) {
    console.error(`[Google Places][getPlacePhotoUrl] Error constructing photo URL for photoName "${photoName}":`, error);
    return null;
  }
}

/**
 * Main function: Given a destination, returns a photo URL (or null if not found).
 */
export async function getPhotoUrlForDestination(destination: string): Promise<string | null> {
  const placeId = await getPlaceId(destination);
  if (!placeId) return null;
  const photo = await getPlacePhotoMetadata(placeId);
  if (!photo) return null;
  return getPlacePhotoUrl(photo.name);
} 