import getConfig from 'next/config';

/**
 * Utility function to safely access server-side configuration
 * This helps ensure API keys are only accessed on the server side
 */
export function getServerConfig() {
  // Get the server runtime config
  const { serverRuntimeConfig } = getConfig() || {};
  
  // Return the server config or empty object if not available
  return {
    googleMapsApiKey: serverRuntimeConfig?.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || '',
  };
}

/**
 * Utility function to safely access public runtime configuration
 * This can be used for non-sensitive configuration that can be exposed to the client
 */
export function getPublicConfig() {
  // Get the public runtime config
  const { publicRuntimeConfig } = getConfig() || {};
  
  // Return the public config or empty object if not available
  return publicRuntimeConfig || {};
} 