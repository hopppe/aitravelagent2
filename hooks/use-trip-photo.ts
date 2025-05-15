import { useEffect, useState } from 'react';

interface UseTripPhotoResult {
  photoUrl: string | null;
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Custom hook that provides a properly URL-encoded path to an image for a destination.
 * @param destination The trip destination (city, landmark, etc.)
 */
export function useTripPhoto(destination: string): UseTripPhotoResult {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    // Reset state when destination changes
    setIsLoading(true);
    setHasError(false);
    setPhotoUrl(null);
    
    // Handle empty destination
    if (!destination || typeof destination !== 'string' || destination.trim() === '') {
      console.log('[useTripPhoto] Empty or invalid destination, skipping photo fetch');
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Create a safe, clean destination string
    const cleanDestination = destination.trim();
    console.log(`[useTripPhoto] Processing destination: "${cleanDestination}"`);
    
    // Generate a valid URL with proper encoding and cache-busting parameter
    // Use timestamp to prevent browser caching
    const timestamp = Date.now();
    const imageUrl = `/api/trip-photo?destination=${encodeURIComponent(cleanDestination)}&t=${timestamp}`;
    
    // Since we're directly returning an image from the API endpoint,
    // we just need to set the URL without additional fetching
    setPhotoUrl(imageUrl);
    setIsLoading(false);
    
    // No cleanup needed for this implementation
  }, [destination]);

  return { photoUrl, isLoading, hasError };
} 