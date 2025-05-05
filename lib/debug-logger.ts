/**
 * Enhanced debug logger utilities
 * For development and debugging of API responses and requests
 */

/**
 * Log API request and response details to the console
 * Safe for both client and server-side usage
 */
export function logApiTransaction(
  title: string, 
  data: any, 
  includeTimestamp = true
): void {
  try {
    const timestamp = includeTimestamp ? `[${new Date().toISOString()}]` : '';
    
    console.group(`🔍 ${timestamp} ${title}`);
    
    if (typeof data === 'object' && data !== null) {
      // For structured data, we'll format it nicely
      console.log(JSON.stringify(data, null, 2));
    } else {
      // For primitive types or other data
      console.log(data);
    }
    
    console.groupEnd();
  } catch (error) {
    console.error('Error in debug logger:', error);
  }
}

/**
 * Create a more visible error in the console
 */
export function logErrorDetails(
  title: string,
  error: any,
  context?: Record<string, any>
): void {
  try {
    console.group(`❌ ERROR: ${title}`);
    console.error('Error details:', error);
    
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    
    if (context) {
      console.log('Context:', context);
    }
    
    console.groupEnd();
  } catch (consoleFail) {
    // Fallback if console methods fail
    console.error('Error logging failed:', consoleFail);
    console.error('Original error:', error);
  }
}

/**
 * Log large data objects only during development
 */
export function devLog(label: string, data: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔧 DEV: ${label}`);
    console.log(data);
    console.groupEnd();
  }
} 