import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '../../../../utils/config';

/**
 * Proxy API for Google Places Photos to avoid exposing the API key
 * Documentation: 
 * - Legacy API: https://developers.google.com/maps/documentation/places/web-service/photos
 * - New API: https://developers.google.com/maps/documentation/places/web-service/place-photos
 */
export async function GET(request: NextRequest) {
  try {
    const { googleMapsApiKey } = getServerConfig();
    
    if (!googleMapsApiKey) {
      console.error('[Photo Proxy] Google Maps API key is not configured');
      return returnPlaceholderImage();
    }

    // Get the photo reference and maxwidth from query params
    const searchParams = request.nextUrl.searchParams;
    const photoReference = searchParams.get('photo_reference');
    const maxwidth = searchParams.get('maxwidth') || '400';
    
    console.log(`[Photo Proxy] Requested photo: ${photoReference?.substring(0, 20)}...`);
    
    if (!photoReference) {
      console.error('[Photo Proxy] Missing photo_reference parameter');
      return returnPlaceholderImage();
    }

    // Check if this is a new API photo reference (they start with "places/")
    const isNewApiPhoto = photoReference.startsWith('places/');
    
    if (isNewApiPhoto) {
      // Use the new Places API v1 for photos
      console.log('[Photo Proxy] Using Places API v1 for photo');
      
      try {
        // Direct media URL for the photo - no need to get metadata first
        const mediaUrl = `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=400&maxWidthPx=400&key=${googleMapsApiKey}`;
        
        // Fetch the photo directly with retry logic
        const mediaResponse = await fetchWithRetry(mediaUrl, {
          next: { revalidate: 0 },
          headers: {
            'X-Goog-Api-Key': googleMapsApiKey,
            'Accept': 'image/*'
          }
        }, 2); // Retry up to 2 times
        
        if (!mediaResponse.ok) {
          console.error(`[Photo Proxy] Error fetching photo media: ${mediaResponse.status}`);
          return returnPlaceholderImage();
        }
        
        // Forward the photo response
        const photo = await mediaResponse.arrayBuffer();
        
        // Get content type from original response
        const contentType = mediaResponse.headers.get('content-type') || 'image/jpeg';
        
        console.log(`[Photo Proxy] Successfully fetched v1 photo, content-type: ${contentType}, size: ${photo.byteLength} bytes`);
        
        // Return the photo with proper content type and cache headers
        return new Response(photo, { 
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=1209600', // Cache for 14 days
            'Expires': new Date(Date.now() + 1209600 * 1000).toUTCString(),
            'Pragma': 'public'
          }
        });
      } catch (error) {
        console.error('[Photo Proxy] Error with v1 photo:', error);
        return returnPlaceholderImage();
      }
    } else {
      // Use the legacy Places API for photos
      console.log('[Photo Proxy] Using legacy Places API for photo');
      
      // Construct the Google Places Photo API URL
      const params = new URLSearchParams();
      params.append('photoreference', photoReference);
      params.append('maxwidth', maxwidth);
      params.append('key', googleMapsApiKey);
      
      const baseUrl = 'https://maps.googleapis.com/maps/api/place/photo';
      const photoUrl = `${baseUrl}?${params.toString()}`;
      
      console.log(`[Photo Proxy] Fetching photo from Google Places API`);
      
      // Make the request to Google Places API with retry logic
      const response = await fetchWithRetry(photoUrl, {
        next: { revalidate: 0 }
      }, 2); // Retry up to 2 times

      if (!response.ok) {
        console.error(`[Photo Proxy] Error fetching photo: ${response.status}`);
        return returnPlaceholderImage();
      }

      // Forward the photo response
      const photo = await response.arrayBuffer();
      
      // Get content type from original response
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      console.log(`[Photo Proxy] Successfully fetched photo, content-type: ${contentType}, size: ${photo.byteLength} bytes`);
      
      // Return the photo with proper content type and cache headers
      return new Response(photo, { 
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=1209600', // Cache for 14 days
          'Expires': new Date(Date.now() + 1209600 * 1000).toUTCString(),
          'Pragma': 'public'
        }
      });
    }
  } catch (error) {
    console.error('[Photo Proxy] Error:', error);
    return returnPlaceholderImage();
  }
}

/**
 * Fetch with retry logic for better reliability
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries: number = 1): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (response.ok) return response;
    
    // If we get a 429 (Too Many Requests) or 5xx error, retry
    if ((response.status === 429 || response.status >= 500) && retries > 0) {
      console.log(`[Photo Proxy] Received ${response.status}, retrying... (${retries} retries left)`);
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`[Photo Proxy] Fetch error, retrying... (${retries} retries left):`, error);
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Return a simple SVG placeholder image
 */
function returnPlaceholderImage() {
  // Simple SVG with bed icon
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#f0f0f0"/>
    <text x="200" y="150" font-family="Arial" font-size="24" text-anchor="middle" fill="#999999">No Image</text>
    <path d="M100,160 L300,160 L300,180 L100,180 Z M100,140 C100,130 110,120 120,120 L280,120 C290,120 300,130 300,140 L300,160 L100,160 Z" fill="#999999"/>
  </svg>`;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
      'Pragma': 'public'
    }
  });
} 