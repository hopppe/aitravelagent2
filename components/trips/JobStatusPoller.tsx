'use client';

import React, { useState, useEffect } from 'react';
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
  
  // Maximum number of "not found" responses before considering it an error
  const MAX_NOT_FOUND_RETRIES = 20;

  // Calculate expected time based on trip days (30-60 seconds range)
  const minSeconds = 30;
  const maxSeconds = 60;
  // Scale polling based on trip days (more days = longer generation time)
  const expectedPolls = Math.min(
    Math.max(minSeconds, tripDays * 5), // 5 seconds per day, minimum 30 seconds
    maxSeconds
  ) / (pollingInterval / 1000);

  useEffect(() => {
    if (!jobId) {
      onError('No job ID provided');
      return;
    }

    // If job is completed or failed, or we've exceeded max polls, don't continue polling
    if (isCompleted(status) || isFailed(status) || (pollCount >= maxPolls)) {
      return;
    }

    const pollJobStatus = async () => {
      try {
        console.log(`Polling job status for ${jobId} (attempt ${pollCount + 1})`);
        const response = await fetch(`/api/job-status?jobId=${jobId}`);
        
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
              // For the first few "not found" responses, just keep polling
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
        if (notFoundCount > 0) setNotFoundCount(0);
        
        const data: JobData = await response.json();
        console.log(`Job ${jobId} status: ${data.status}`);
        
        // Update state with the job status data
        setStatus(data.status);
        setDetails(data);
        
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
            setMessage('Creating your personalized travel experience...');
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

    // Set up polling
    const timer = setTimeout(pollJobStatus, pollingInterval);
    
    return () => clearTimeout(timer);
  }, [jobId, status, pollCount, maxPolls, pollingInterval, onComplete, onError, notFoundCount, tripDays]);

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