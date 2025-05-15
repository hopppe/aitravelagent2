import { NextRequest, NextResponse } from 'next/server';
import { getPlaceId, getPlacePhotoMetadata } from '@/lib/google-places';

/**
 * GET /api/trip-photo?destination=Paris
 * Directly returns a photo for the given destination name.
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  const purpose = req.headers.get('purpose') || req.headers.get('sec-purpose');
  const isPrefetch = purpose === 'prefetch';
  
  // If this is a prefetch request, return a simple response
  if (isPrefetch) {
    // console.log('[Trip Photo API] Detected prefetch request, returning empty response');
    return new Response(null, { status: 204 });
  }
  
  // If no API key is available, return a placeholder
  if (!apiKey) {
    console.error('[Trip Photo API] Missing GOOGLE_MAPS_API_KEY environment variable');
    return returnPlaceholderImage(null);
  }

  // Get the destination from the query string
  const destination = req.nextUrl.searchParams.get('destination');
  
  // Handle missing destination parameter
  if (!destination) {
    console.error('[Trip Photo API] Missing destination parameter. URL:', req.url);
    // console.log('[Trip Photo API] All search params:', Object.fromEntries(req.nextUrl.searchParams.entries()));
    // console.log('[Trip Photo API] Headers:', Object.fromEntries(req.headers.entries()));
    
    // If this appears to be a direct browser request (has accept header with text/html)
    const accept = req.headers.get('accept') || '';
    if (accept.includes('text/html')) {
      // console.log('[Trip Photo API] This appears to be a direct browser request');
      return new Response(
        '<html><body><h1>Trip Photo API</h1><p>This endpoint requires a destination parameter.</p><p>Example: <code>/api/trip-photo?destination=Paris</code></p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    return returnPlaceholderImage(null);
  }

  try {
    // console.log(`[Trip Photo API] Fetching photo for destination: ${destination}`);
    
    // Step 1: Get the place ID from the destination name
    const placeId = await getPlaceId(destination);
    if (!placeId) {
      // console.log(`[Trip Photo API] No place ID found for ${destination}`);
      return returnPlaceholderImage(destination);
    }
    // console.log(`[Trip Photo API] Found place ID for ${destination}: ${placeId}`);
    
    // Step 2: Get the photo metadata from the place ID
    const photo = await getPlacePhotoMetadata(placeId);
    if (!photo) {
      // console.log(`[Trip Photo API] No photo found for place ID ${placeId}`);
      return returnPlaceholderImage(destination);
    }
    // console.log(`[Trip Photo API] Found photo metadata for ${destination}: ${JSON.stringify(photo)}`);
    
    // Step 3: Construct the photo URL with the Places API v1 format
    const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&maxWidthPx=800`;
    // console.log(`[Trip Photo API] Photo URL constructed for ${destination}`);
    
    // Directly fetch and return the photo
    try {
      // Fetch the image with retry logic
      const response = await fetchWithRetry(photoUrl, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'Accept': 'image/*'
        }
      }, 2); // Retry up to 2 times
      
      if (!response.ok) {
        console.error(`[Trip Photo API] Error fetching photo media for ${destination} (URL: ${photoUrl}). Status: ${response.status}`);
        return returnPlaceholderImage(destination);
      }
      
      // Get the image data
      const photoData = await response.arrayBuffer();
      
      // Get the content type
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // console.log(`[Trip Photo API] Successfully fetched photo for ${destination}, content-type: ${contentType}, size: ${photoData.byteLength} bytes`);
      
      // Return the image directly with appropriate headers
      return new Response(photoData, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=604800', // Cache for 7 days
          'Expires': new Date(Date.now() + 604800 * 1000).toUTCString(),
          'Pragma': 'public'
        }
      });
    } catch (fetchError) {
      console.error(`[Trip Photo API] Exception during photo media fetch for ${destination} (URL: ${photoUrl}):`, fetchError);
      return returnPlaceholderImage(destination);
    }
  } catch (error) {
    // Log error for debugging
    console.error(`[Trip Photo API] General error fetching trip photo for ${destination}:`, error);
    return returnPlaceholderImage(destination);
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
      console.warn(`[Trip Photo API][fetchWithRetry] Received status ${response.status} for ${url}. Retrying... (${retries} retries left)`);
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[Trip Photo API][fetchWithRetry] Fetch error for ${url}. Retrying... (${retries} retries left):`, error);
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Return a placeholder image with the destination name
 */
function returnPlaceholderImage(destination: string | null) {
  // Create an SVG placeholder with the destination name if provided
  const text = destination || 'No Image';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#f0f0f0"/>
    <text x="400" y="280" font-family="Arial" font-size="32" text-anchor="middle" fill="#999999">${text}</text>
    <text x="400" y="320" font-family="Arial" font-size="24" text-anchor="middle" fill="#999999">No Image Available</text>
  </svg>`;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      'Expires': new Date(Date.now() + 86400 * 1000).toUTCString(),
      'Pragma': 'public'
    }
  });
} 