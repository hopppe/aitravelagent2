'use client';

import React, { useState, useEffect, useRef } from 'react';
import { JobData } from '../../lib/supabase';

// Props type definition
interface JobStatusPollerProps {
  jobId: string;
  onComplete: (result: any) => void;
  onError: (error: string) => void;
  pollingInterval?: number; // ms between polls
  maxPolls?: number; // max number of polls before giving up
  tripDays?: number; // Number of days in the trip for progress calculation
}

// Type guard functions to help TypeScript narrow types
const isCompleted = (status: string): boolean => status === 'completed';
const isFailed = (status: string): boolean => status === 'failed';

const JobStatusPoller: React.FC<JobStatusPollerProps> = ({
  jobId,
  onComplete,
  onError,
  pollingInterval = 3000, // Default 3 seconds
  maxPolls = 120, // Default max 6 minutes
  tripDays = 5, // Default to 5 days if not specified
}) => {
  const [status, setStatus] = useState<string>('queued');
  const [pollCount, setPollCount] = useState(0);
  const [message, setMessage] = useState('We\'re crafting your perfect itinerary...');
  const [details, setDetails] = useState<JobData | null>(null);
  const [notFoundCount, setNotFoundCount] = useState(0);
  const [hasErrored, setHasErrored] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [isOffline, setIsOffline] = useState(false);
  const [currentPollingInterval, setCurrentPollingInterval] = useState(pollingInterval);
  const [connectionQuality, setConnectionQuality] = useState<'good'|'poor'|'unknown'>('unknown');

  // Use refs to track response times for connection quality estimation
  const lastFetchTime = useRef<number>(0);
  const responseTimeHistory = useRef<number[]>([]);
  
  // Maximum number of "not found" responses before considering it an error
  const MAX_NOT_FOUND_RETRIES = 20;
  
  // Detect if we're on a mobile device to adjust polling behavior
  const isMobile = typeof navigator !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Detect if we're on iOS Safari specifically
  const isIOSSafari = typeof navigator !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent) && // Not Chrome, Firefox, or Edge
    /WebKit|Safari/i.test(navigator.userAgent);
  
  if (isIOSSafari) {
    console.log('iOS Safari detected - applying Safari-specific optimizations');
  }

  // Enhanced network status monitoring with active connection testing
  useEffect(() => {
    const testConnectionSpeed = async () => {
      try {
        const startTime = Date.now();
        // Use a cache-busting parameter and reduced timeout for connection testing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // Fetch a tiny resource with a cache buster to test connection
        const response = await fetch(`/api/ping?t=${Date.now()}`, {
          signal: controller.signal,
          // Use 'no-store' for Safari which can aggressively cache
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          // Keep a rolling window of last 3 response times
          responseTimeHistory.current.push(responseTime);
          if (responseTimeHistory.current.length > 3) {
            responseTimeHistory.current.shift();
          }
          
          // Calculate average response time
          const avgResponseTime = responseTimeHistory.current.reduce((a, b) => a + b, 0) / 
            Math.max(1, responseTimeHistory.current.length);
            
          // Determine connection quality based on average response time
          if (avgResponseTime < 300) {
            setConnectionQuality('good');
          } else if (avgResponseTime < 1000) {
            setConnectionQuality('poor');
            console.log(`Poor connection detected (${Math.round(avgResponseTime)}ms avg response time)`);
          } else {
            setConnectionQuality('poor');
            console.log(`Very poor connection detected (${Math.round(avgResponseTime)}ms avg response time)`);
          }
          
          setIsOffline(false);
          return true;
        }
        return false;
      } catch (error) {
        console.log('Connection test failed:', error);
        setConnectionQuality('poor');
        return false;
      }
    };
    
    const handleOnline = async () => {
      console.log('Browser reports network connection restored');
      // For iOS Safari, the online event can be unreliable, so always run an actual test
      if (isIOSSafari || await testConnectionSpeed()) {
        setIsOffline(false);
        // Reset polling to appropriate interval based on device and connection quality
        const newInterval = isMobile || connectionQuality === 'poor' 
          ? pollingInterval * 1.5 
          : pollingInterval;
        setCurrentPollingInterval(newInterval);
        console.log(`Connection restored, adjusted polling interval to ${newInterval}ms`);
      }
    };
    
    const handleOffline = () => {
      console.log('Browser reports network connection lost');
      
      // For Safari on iOS, verify with an actual network request since events are unreliable
      if (isIOSSafari) {
        // Quick test with minimal timeout
        fetch('/api/ping?t=' + Date.now(), { 
          signal: AbortSignal.timeout(2000),
          cache: 'no-store' 
        })
          .then(() => {
            console.log('iOS Safari incorrectly reported offline, but we can still reach the server');
            // Don't update offline state as the connection actually works
          })
          .catch(() => {
            console.log('Confirmed offline status with actual request failure');
            setIsOffline(true);
            setMessage('Waiting for network connection...');
          });
      } else {
        // For other browsers, trust the event
        setIsOffline(true);
        setMessage('Waiting for network connection...');
      }
    };
    
    const checkConnectionStatus = async () => {
      // For iOS Safari, always perform an actual network test
      if (isIOSSafari || navigator.onLine) {
        await testConnectionSpeed();
      } else {
        setIsOffline(true);
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection check
    checkConnectionStatus();
    
    // For mobile devices, perform more aggressive memory management
    let connectionCheckInterval: NodeJS.Timeout;
    if (isMobile) {
      // Schedule periodic connection quality checks
      connectionCheckInterval = setInterval(checkConnectionStatus, 15000);
      
      // Adjust polling interval based on device
      setCurrentPollingInterval(currentValue => {
        const newValue = pollingInterval * 1.5;
        console.log(`Mobile device detected, adjusted polling interval to ${newValue}ms`);
        return newValue;
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connectionCheckInterval) clearInterval(connectionCheckInterval);
      
      // Clean up memory
      responseTimeHistory.current = [];
    };
  }, [pollingInterval, isMobile, connectionQuality]);

  // Calculate expected time based on trip days (30-60 seconds range)
  const minSeconds = 30;
  const maxSeconds = 60;
  // Scale polling based on trip days (more days = longer generation time)
  const expectedPolls = Math.min(
    Math.max(minSeconds, tripDays * 5), // 5 seconds per day, minimum 30 seconds
    maxSeconds
  ) / (currentPollingInterval / 1000);

  useEffect(() => {
    if (!jobId) {
      onError('No job ID provided');
      return;
    }

    // If job is completed or failed, or we've exceeded max polls, don't continue polling
    if (isCompleted(status) || isFailed(status) || (pollCount >= maxPolls)) {
      return;
    }
    
    // If device is offline, don't poll but set up a retry timer with increasing backoff
    if (isOffline) {
      // Use exponential backoff for connection retry attempts, capped at 30 seconds
      const backoffTime = Math.min(5000 * Math.pow(1.5, Math.min(5, Math.floor(pollCount / 5))), 30000);
      
      const offlineTimer = setTimeout(() => {
        console.log(`Checking connection status after ${backoffTime/1000}s backoff`);
        // Attempt to fetch a tiny resource to check connection
        fetch(`/api/ping?t=${Date.now()}`)
          .then(response => {
            if (response.ok) {
              console.log('Connection successfully restored');
              setIsOffline(false);
              // Will trigger a new poll
              setPollCount(prev => prev);
            } else {
              // Stay in offline mode and check again later with backoff
              console.log('Still offline (connection test resource returned error)');
              setPollCount(prev => prev + 1); // Increment poll count to increase backoff
            }
          })
          .catch(() => {
            console.log('Still offline (connection test failed)');
            setPollCount(prev => prev + 1); // Increment poll count to increase backoff
          });
      }, backoffTime);
      
      return () => clearTimeout(offlineTimer);
    }

    const pollJobStatus = async () => {
      try {
        // Track fetch start time to measure connection quality
        lastFetchTime.current = Date.now();
        console.log(`Polling job status for ${jobId} (attempt ${pollCount + 1})`);
        
        // Create fetch request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), isIOSSafari ? 15000 : 10000); // Longer timeout for Safari
        
        const response = await fetch(`/api/job-status?jobId=${jobId}&_t=${Date.now()}`, {
          signal: controller.signal,
          // Use 'no-store' for Safari which can aggressively cache
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        // Measure response time for connection quality heuristic
        const responseTime = Date.now() - lastFetchTime.current;
        responseTimeHistory.current.push(responseTime);
        if (responseTimeHistory.current.length > 3) {
          responseTimeHistory.current.shift();
        }
        
        console.log(`Got response in ${responseTime}ms`);
        
        // If response time is very slow, mark connection as poor quality
        if (responseTime > 1500) {
          console.log('Slow response detected, considering poor connection');
          setConnectionQuality('poor');
          // Adjust polling interval for poor connections
          if (currentPollingInterval < pollingInterval * 2) {
            setCurrentPollingInterval(previous => Math.min(previous * 1.2, pollingInterval * 2.5));
          }
        }
        
        if (!response.ok) {
          // Try to parse error response
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: `HTTP Error ${response.status}` };
          }
          
          // Special handling for 404 Not Found errors
          if (response.status === 404) {
            // Increment not found counter
            const newNotFoundCount = notFoundCount + 1;
            setNotFoundCount(newNotFoundCount);
            
            console.log(`Job ${jobId} not found (attempt ${newNotFoundCount}/${MAX_NOT_FOUND_RETRIES})`);
            
            // Only throw an error if we've exceeded max retries for not found
            if (newNotFoundCount >= MAX_NOT_FOUND_RETRIES) {
              const errMsg = `Job ${jobId} not found after ${MAX_NOT_FOUND_RETRIES} attempts.`;
              console.error(errMsg);
              setErrorDetails(errMsg);
              throw new Error(errMsg);
            } else {
              // For the first few "not found" responses, just keep polling with backoff
              setMessage('Getting everything ready for your trip...');
              
              // Add increasing delay for each retry (exponential backoff)
              const backoffDelay = Math.min(1000 * Math.pow(1.5, newNotFoundCount - 1), 10000);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
              
              // Don't throw, just continue polling
              setPollCount(prev => prev + 1);
              return;
            }
          }
          
          throw new Error(errorData.error || 'Failed to fetch job status');
        }
        
        // Reset not found counter on successful response
        if (notFoundCount > 0) {
          setNotFoundCount(0);
          console.log('Reset not found counter after successful response');
        }
        
        const data: JobData = await response.json();
        console.log(`Job ${jobId} status: ${data.status}`);
        
        // Update state with the job status data
        setStatus(data.status);
        setDetails(data);
        
        // If we're on mobile or have poor connection quality, and in the processing state, 
        // slightly increase polling interval for efficiency
        if ((isMobile || connectionQuality === 'poor') && 
            data.status === 'processing' && 
            currentPollingInterval < pollingInterval * 2.5) {
          // Gradually increase polling interval up to 2.5x the original
          const newInterval = Math.min(currentPollingInterval * 1.1, pollingInterval * 2.5);
          console.log(`Adjusting polling interval to ${Math.round(newInterval)}ms (mobile/poor connection optimization)`);
          setCurrentPollingInterval(newInterval);
        }
        
        // Handle different status cases
        switch (data.status) {
          case 'completed':
            console.log(`Job ${jobId} completed, processing result`);
            if (data.result?.rawContent) {
              // The result has the raw content from OpenAI - client will parse
              onComplete(data.result);
            } else if (data.result?.itinerary) {
              // Legacy format with parsed itinerary
              console.log(`Job ${jobId} has parsed itinerary result`);
              onComplete(data.result);
            } else if (data.raw_result) {
              // Try to parse the raw_result directly
              console.log(`Job ${jobId} has raw_result, parsing now`);
              try {
                // Set the raw content directly for the client to parse
                onComplete({ rawContent: data.raw_result });
              } catch (parseError) {
                console.error(`Error parsing raw_result for job ${jobId}:`, parseError);
                const errMsg = 'Failed to parse job result';
                setErrorDetails(errMsg);
                onError(errMsg);
              }
            } else {
              // No recognizable result format
              console.error(`Job ${jobId} marked as completed but has no result`);
              const errMsg = 'Completed job has no valid result format';
              setErrorDetails(errMsg);
              onError(errMsg);
            }
            break;
            
          case 'failed':
            console.error(`Job ${jobId} failed:`, data.error);
            const errMsg = data.error || 'Job failed';
            setErrorDetails(errMsg);
            onError(errMsg);
            setMessage('The itinerary generation failed. Please try again.');
            break;
            
          case 'processing':
            // For longer processing times, give more informative messages
            if (pollCount > 15) {
              setMessage('Almost there! Creating your personalized travel experience...');
            } else if (pollCount > 5) {
              setMessage('Creating your personalized travel experience...');
            } else {
              setMessage('Working on your travel itinerary...');
            }
            break;
            
          case 'queued':
            setMessage('Your trip is in our queue. We\'ll begin planning shortly...');
            break;
            
          default:
            setMessage(`Planning your perfect adventure...`);
        }
      } catch (error: any) {
        console.error(`Error polling job ${jobId}:`, error);
        setHasErrored(true);
        setErrorDetails(error.message || 'Unknown error');
        
        // Check if it might be a network error
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('NetworkError') ||
            error.message?.includes('network') ||
            !navigator.onLine) {
          setIsOffline(true);
          setMessage('Connection issue. Waiting for network...');
          console.log('Network error detected, entering offline mode');
          // Don't increment poll count while offline
          return;
        }
        
        // After a certain number of polls with errors, show an error to the user
        if (pollCount > 5) {
          onError(error.message || 'Failed to check job status');
        } else {
          setMessage('Connection issue. Retrying...');
        }
      }
      
      // Increment poll count
      setPollCount(prev => prev + 1);
    };

    // Set up polling with the current interval
    const timer = setTimeout(pollJobStatus, currentPollingInterval);
    
    return () => clearTimeout(timer);
  }, [jobId, status, pollCount, maxPolls, currentPollingInterval, onComplete, onError, notFoundCount, tripDays, isOffline, connectionQuality]);

  // Progress calculation based on expected time for trip days
  // Use a non-linear easing function for smoother animation
  const calculateProgress = () => {
    // Normalized progress from 0 to 1 based on poll count
    const normProgress = Math.min(pollCount / expectedPolls, 0.99);
    
    // Apply easing function to make progress feel more natural
    // This creates a curve that starts slower and accelerates
    const easedProgress = normProgress < 0.5
      ? 2 * normProgress * normProgress
      : 1 - Math.pow(-2 * normProgress + 2, 2) / 2;
      
    return Math.round(easedProgress * 100);
  };
  
  const progress = calculateProgress();
  
  // Calculate color based on status
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      default: return 'bg-blue-500';
    }
  };

  // If offline, show a network offline message
  if (isOffline) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
          <div className="flex flex-col items-center mb-5">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-4.5-8.5M3 15l4.5-11M13.5 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Network Connection Lost</h3>
          </div>
          
          <div className="text-center mb-5">
            <p className="text-md text-gray-700">Waiting for your internet connection to return...</p>
            <p className="text-sm text-gray-500 mt-1">Your trip is still being generated in the background.</p>
            {isMobile && (
              <p className="text-xs text-gray-500 mt-1">
                Mobile connections can be less reliable. Try moving to an area with better reception.
              </p>
            )}
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={() => {
                if (navigator.onLine) {
                  setIsOffline(false);
                  setPollCount(prev => prev); // Force a refresh
                } else {
                  // Try an actual network request to check connection
                  fetch(`/api/ping?t=${Date.now()}`)
                    .then(() => {
                      setIsOffline(false);
                      setPollCount(prev => prev); // Force a refresh
                    })
                    .catch(err => {
                      console.log('Still offline after manual check:', err);
                      // Show a brief message to the user
                      setMessage('Still offline. Please check your connection.');
                    });
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Only show the progress bar if we're still waiting
  if (isCompleted(status) || isFailed(status)) {
    return null;
  }

  // If we've exceeded max polls but haven't completed or failed
  if (pollCount >= maxPolls && !isCompleted(status) && !isFailed(status)) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Taking longer than expected</h3>
          <p className="text-sm text-gray-700 mb-4">
            Your itinerary is still being generated, but it's taking longer than usual.
            {connectionQuality === 'poor' && 
              " This may be due to a slow internet connection."}
            {isMobile && 
              " Mobile connections can sometimes cause delays."}
          </p>
          <div className="flex space-x-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Refresh page
            </button>
            <button 
              onClick={() => setPollCount(0)}
              className="px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Keep waiting
            </button>
          </div>
          {errorDetails && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              <p>Error details: {errorDetails}</p>
              <p className="mt-1">Try checking your network connection.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center mb-5">
          <div className="mb-4 relative">
            <svg className="w-16 h-16 text-blue-100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="10" />
            </svg>
            <svg className="w-16 h-16 absolute top-0 left-0 text-blue-500" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                stroke="currentColor" 
                strokeWidth="10"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress / 100)}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-900">{progress}%</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Creating Your Itinerary</h3>
        </div>
        
        <div className="text-center mb-2">
          <p className="text-md text-gray-700">{message}</p>
          
          {connectionQuality === 'poor' && (
            <p className="text-xs text-gray-500 mt-1">
              {isMobile ? 'Mobile connection detected. This may take a bit longer.' : 'Slow connection detected. This may take a bit longer.'}
            </p>
          )}
          
          {hasErrored && (
            <p className="text-xs text-red-600 mt-2">
              Connection issue, retrying...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobStatusPoller; 