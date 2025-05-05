/**
 * Itinerary error handling utilities
 * Helper functions to handle errors related to itinerary generation and processing
 */

/**
 * Process an error object and return user-friendly messages
 */
export function processItineraryError(err: unknown): {
  errorMessage: string;
  details: string;
} {
  let errorMessage = 'An unexpected error occurred';
  let details = '';
  
  if (err instanceof Error) {
    // Store original message as details
    details = err.message;
    
    // Clean up technical error messages to make them more user-friendly
    const message = err.message;
    
    if (message.includes('Supabase')) {
      errorMessage = 'Database connection error. Please check your Supabase setup.';
    } else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      errorMessage = 'Network error: Please check your internet connection and try again.';
    } else if (message.includes('timeout') || message.includes('timed out')) {
      errorMessage = 'Your itinerary is taking too long to generate. Please try a simpler itinerary or try again later.';
    } else if (message.includes('OpenAI API')) {
      errorMessage = 'There was an issue with our AI service. Please try again later.';
    } else if (message.includes('parse') || message.includes('JSON') || message.includes('Invalid response')) {
      errorMessage = 'We received an unexpected response format. Please try again.';
    } else if (message.includes('itinerary')) {
      errorMessage = 'We had trouble creating your itinerary. Please try again or modify your preferences.';
    }
  } else if (err) {
    // For non-Error objects
    details = String(err);
  }
  
  return { errorMessage, details };
}

/**
 * Get appropriate troubleshooting tips based on error type
 */
export function getItineraryTroubleshootingTips(errorMessage: string): string[] {
  const commonTips = [
    "Check your internet connection and try again",
    "If the error persists, our AI service might be experiencing high demand"
  ];
  
  // Specific tips based on error type
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return [
      "Check that you have a stable internet connection",
      "Try refreshing your browser or restarting your device",
      "Disable any VPN or proxy services temporarily",
      ...commonTips
    ];
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('too long')) {
    return [
      "Try simplifying your request by shortening the trip duration",
      "Choose more common destinations with better data availability",
      "Select fewer preference categories",
      ...commonTips
    ];
  }
  
  if (errorMessage.includes('AI service') || errorMessage.includes('unexpected response')) {
    return [
      "Our AI service might be experiencing issues",
      "Wait a few minutes and try again",
      "Try a different destination or time period",
      ...commonTips
    ];
  }
  
  // Default tips
  return [
    "Try simplifying your request by shortening the trip duration",
    "Choose more common destinations with better data availability",
    "Try again in a few minutes",
    ...commonTips
  ];
}

/**
 * Log itinerary generation errors for analytics/debugging
 */
export function logItineraryError(errorMessage: string, details: string, formData: any): void {
  console.error('Itinerary generation error:', {
    errorMessage,
    details,
    formData: {
      ...formData,
      destination: formData.destination,
      duration: formData.startDate && formData.endDate ? 
        new Date(formData.endDate).getDate() - new Date(formData.startDate).getDate() : 'unknown'
    }
  });
} 