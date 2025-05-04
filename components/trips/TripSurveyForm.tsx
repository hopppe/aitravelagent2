'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import JobStatusPoller from './JobStatusPoller';
import ErrorDisplay from '../ErrorDisplay';

// Define the survey steps
type SurveyStep = 'destination' | 'dates' | 'purpose' | 'budget' | 'preferences';

// Define preference categories and options
const preferenceOptions = [
  { id: 'nature', label: 'Nature & Outdoors' },
  { id: 'culture', label: 'Culture & Arts' },
  { id: 'food', label: 'Food & Dining' },
  { id: 'adventure', label: 'Adventure Activities' },
  { id: 'relaxation', label: 'Relaxation & Wellness' },
  { id: 'history', label: 'History & Landmarks' },
  { id: 'nightlife', label: 'Nightlife & Entertainment' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'family', label: 'Family-friendly Activities' },
];

// Define trip purpose options
const tripPurposeOptions = [
  { id: 'vacation', label: 'Vacation' },
  { id: 'honeymoon', label: 'Honeymoon' },
  { id: 'family', label: 'Family Trip' },
  { id: 'solo', label: 'Solo Adventure' },
  { id: 'business', label: 'Business Trip' },
  { id: 'weekend', label: 'Weekend Getaway' },
  { id: 'roadtrip', label: 'Road Trip' },
];

// Budget range options
const budgetOptions = [
  { id: 'budget', label: 'Budget-friendly', description: 'Economical options, hostels, street food' },
  { id: 'moderate', label: 'Moderate', description: 'Mid-range hotels, some nice restaurants' },
  { id: 'luxury', label: 'Luxury', description: 'High-end hotels, fine dining, premium experiences' },
];

export default function TripSurveyForm() {
  const router = useRouter();
  
  // State for form inputs
  const [currentStep, setCurrentStep] = useState<SurveyStep>('destination');
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    purpose: '',
    budget: '',
    preferences: [] as string[],
  });
  
  // Add loading and job tracking state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // Add error details state
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle radio button selection
  const handleRadioChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  // Handle checkbox preferences
  const handlePreferenceToggle = (preferenceId: string) => {
    const updatedPreferences = formData.preferences.includes(preferenceId)
      ? formData.preferences.filter(id => id !== preferenceId)
      : [...formData.preferences, preferenceId];
    
    setFormData({ ...formData, preferences: updatedPreferences });
  };

  // Move to next step
  const nextStep = () => {
    switch (currentStep) {
      case 'destination':
        if (formData.destination) setCurrentStep('dates');
        break;
      case 'dates':
        if (formData.startDate && formData.endDate) setCurrentStep('purpose');
        break;
      case 'purpose':
        if (formData.purpose) setCurrentStep('budget');
        break;
      case 'budget':
        if (formData.budget) setCurrentStep('preferences');
        break;
      case 'preferences':
        // Submit the form
        handleSubmit();
        break;
    }
  };

  // Move back a step
  const prevStep = () => {
    switch (currentStep) {
      case 'dates': setCurrentStep('destination'); break;
      case 'purpose': setCurrentStep('dates'); break;
      case 'budget': setCurrentStep('purpose'); break;
      case 'preferences': setCurrentStep('budget'); break;
    }
  };

  // Submit the form
  const handleSubmit = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setErrorDetails(null);
      setJobId(null);
      
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      // Get the response data first, then check if it's ok
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response format from server');
      }
      
      // Now check if the response was ok
      if (!response.ok) {
        // Show more detailed error message if available
        const errorMessage = data.error || 'Failed to generate itinerary';
        throw new Error(errorMessage);
      }
      
      // Check if the response contains a job ID (background processing)
      if (data.jobId) {
        setJobId(data.jobId);
        
        // If job is already completed (for mock data in development)
        if (data.status === 'completed') {
          handleJobComplete(data.result);
        }
        
        // Background job will be polled by JobStatusPoller component
        return;
      }
      
      // Legacy mode: direct itinerary response
      if (!data.itinerary) {
        throw new Error('API response missing itinerary data');
      }
      
      // Store the itinerary and navigate
      handleStoreItineraryAndNavigate(data.itinerary);
      
    } catch (err) {
      // Display a more user-friendly error message
      let errorMessage = 'An unexpected error occurred';
      let details = '';
      
      if (err instanceof Error) {
        // Clean up technical error messages to make them more user-friendly
        const message = err.message;
        details = message; // Store original message as details
        
        if (message.includes('Supabase')) {
          errorMessage = 'Database connection error. Please check your Supabase setup.';
        } else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
          errorMessage = 'Network error: Please check your internet connection and try again.';
        } else if (message.includes('itinerary')) {
          errorMessage = 'We had trouble creating your itinerary. Please try again or modify your preferences.';
        }
      }
      
      setError(errorMessage);
      setErrorDetails(details);
      setIsGenerating(false);
    }
  };
  
  // Handle job completion
  const handleJobComplete = (result: any) => {
    try {
      // We might have a raw string that needs parsing
      let itinerary;
      
      if (result.rawContent) {
        // Try to extract JSON from the raw content string
        const cleanContent = result.rawContent
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
          
        try {
          // Try to parse the content first
          itinerary = JSON.parse(cleanContent);
        } catch (e) {
          // If direct parsing fails, try to extract JSON from within markdown or other formatting
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            itinerary = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not extract JSON from the response');
          }
        }
      } else if (result.itinerary) {
        // Already parsed itinerary
        itinerary = result.itinerary;
      } else {
        throw new Error('Invalid response format');
      }
      
      // Apply normalizations for compatibility
      if (itinerary.budgetEstimate && !itinerary.budget) {
        itinerary.budget = itinerary.budgetEstimate;
      }
      
      // Store the itinerary and navigate
      handleStoreItineraryAndNavigate(itinerary);
      
    } catch (err) {
      // Handle errors in processing job result
      let errorMessage = 'Error processing the generated itinerary';
      let details = '';
      
      if (err instanceof Error) {
        details = err.message;
      }
      
      setError(errorMessage);
      setErrorDetails(details);
      setIsGenerating(false);
    }
  };
  
  // Handle job error
  const handleJobError = (errorMessage: string) => {
    setError('Generation failed');
    setErrorDetails(errorMessage);
    setIsGenerating(false);
  };
  
  // Store itinerary and navigate to results page
  const handleStoreItineraryAndNavigate = (itinerary: any) => {
    try {
      // Validate the itinerary data
      if (!itinerary.days || !Array.isArray(itinerary.days)) {
        throw new Error('Invalid itinerary structure received');
      }

      // Validate and fix coordinates client-side
      let coordinatesFixed = 0;
      
      for (const day of itinerary.days) {
        if (!day.activities || !Array.isArray(day.activities)) {
          day.activities = [];
          continue;
        }
        
        for (const activity of day.activities) {
          // Skip if not an object
          if (!activity || typeof activity !== 'object') continue;
          
          // Ensure coordinates exist and are properly formatted
          if (!activity.coordinates || typeof activity.coordinates !== 'object') {
            activity.coordinates = { lat: 40.7128, lng: -74.0060 }; // Default to NYC coordinates
            coordinatesFixed++;
          } else {
            // Make sure lat and lng are numbers
            if (typeof activity.coordinates.lat !== 'number' && activity.coordinates.lat !== undefined) {
              activity.coordinates.lat = parseFloat(String(activity.coordinates.lat)) || 40.7128;
              coordinatesFixed++;
            } else if (activity.coordinates.lat === undefined) {
              activity.coordinates.lat = 40.7128;
              coordinatesFixed++;
            }
            
            if (typeof activity.coordinates.lng !== 'number' && activity.coordinates.lng !== undefined) {
              activity.coordinates.lng = parseFloat(String(activity.coordinates.lng)) || -74.0060;
              coordinatesFixed++;
            } else if (activity.coordinates.lng === undefined) {
              activity.coordinates.lng = -74.0060;
              coordinatesFixed++;
            }
          }
        }
      }
      
      // Store in localStorage
      const itineraryJson = JSON.stringify(itinerary);
      localStorage.setItem('generatedItinerary', itineraryJson);
      
      // Navigate to the generated trip page
      router.push('/trips/generated-trip');
    } catch (storageError) {
      throw new Error('Failed to save itinerary data: ' + 
        (storageError instanceof Error ? storageError.message : 'Unknown error'));
    }
  };

  // Render different form sections based on current step
  const renderFormStep = () => {
    switch (currentStep) {
      case 'destination':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Where do you want to go?</h2>
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                Destination
              </label>
              <input
                id="destination"
                name="destination"
                type="text"
                value={formData.destination}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="City, country, or region"
                required
              />
            </div>
          </div>
        );
      
      case 'dates':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">When are you traveling?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                <label htmlFor="startDate" className="block text-sm font-medium bg-gray-50 p-3 border-b border-gray-200">
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full p-4 text-lg focus:ring-primary focus:border-primary calendar-input"
                  required
                />
              </div>
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                <label htmlFor="endDate" className="block text-sm font-medium bg-gray-50 p-3 border-b border-gray-200">
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full p-4 text-lg focus:ring-primary focus:border-primary calendar-input"
                  required
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 italic mt-2">Select your travel dates to help us plan the perfect itinerary length.</p>
          </div>
        );
      
      case 'purpose':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What's the purpose of your trip?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tripPurposeOptions.map(option => (
                <div
                  key={option.id}
                  className={`
                    p-4 border rounded-md cursor-pointer transition-all
                    ${formData.purpose === option.id 
                      ? 'border-primary bg-primary bg-opacity-10' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleRadioChange('purpose', option.id)}
                >
                  <div className="flex items-center">
                    <div className="h-4 w-4 flex items-center justify-center">
                      <div 
                        className={`rounded-full ${formData.purpose === option.id ? 'h-4 w-4 bg-primary' : 'h-3 w-3 border border-gray-400'}`}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {option.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'budget':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What's your budget range?</h2>
            <div className="space-y-3">
              {budgetOptions.map(option => (
                <div
                  key={option.id}
                  className={`
                    p-4 border rounded-md cursor-pointer transition-all
                    ${formData.budget === option.id 
                      ? 'border-primary bg-primary bg-opacity-10' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleRadioChange('budget', option.id)}
                >
                  <div className="flex items-start">
                    <div className="h-4 w-4 mt-1 flex items-center justify-center">
                      <div 
                        className={`rounded-full ${formData.budget === option.id ? 'h-4 w-4 bg-primary' : 'h-3 w-3 border border-gray-400'}`}
                      ></div>
                    </div>
                    <div className="ml-2">
                      <span className="text-sm font-medium text-gray-700">
                        {option.label}
                      </span>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'preferences':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What do you enjoy when traveling?</h2>
            <p className="text-gray-600 text-sm">Select all that apply. This helps us tailor your itinerary.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {preferenceOptions.map(option => (
                <div
                  key={option.id}
                  className={`
                    p-3 border rounded-md cursor-pointer transition-all
                    ${formData.preferences.includes(option.id) 
                      ? 'border-primary bg-primary bg-opacity-10' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handlePreferenceToggle(option.id)}
                >
                  <div className="flex items-center">
                    <div className="h-4 w-4 flex items-center justify-center">
                      <div 
                        className={`${formData.preferences.includes(option.id) 
                          ? 'h-3 w-3 bg-primary rounded-sm' 
                          : 'h-3 w-3 border border-gray-400 rounded-sm'}`}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {option.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  // Progress indicators
  const totalSteps = 5;
  const currentStepIndex = ['destination', 'dates', 'purpose', 'budget', 'preferences'].indexOf(currentStep) + 1;
  
  // Show a better loading state with the job status poller
  const renderLoadingState = () => {
    if (!isGenerating) return null;
    
    // Calculate trip days based on start and end dates
    let tripDays = 5; // Default to 5 days if dates are not valid
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        // Calculate the difference in days
        const differenceInTime = endDate.getTime() - startDate.getTime();
        const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24)) + 1; // +1 to include the end day
        
        if (differenceInDays > 0) {
          tripDays = differenceInDays;
        }
      }
    }
    
    // Always use the JobStatusPoller component, even before we have a job ID
    return (
      <JobStatusPoller 
        jobId={jobId || 'pending'} // Use a placeholder jobId if none exists yet
        onComplete={handleJobComplete}
        onError={handleJobError}
        pollingInterval={2000} // Poll every 2 seconds
        maxPolls={60} // Up to 2 minutes (60 * 2s)
        tripDays={tripDays}
      />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {renderFormStep()}
      
      {/* Error message */}
      {error && (
        <ErrorDisplay 
          title="Error Generating Itinerary"
          message={error}
          details={errorDetails || undefined}
          suggestion="Please try again or modify your preferences"
          actionText="Try Again"
          actionFn={() => {
            setError(null);
            setErrorDetails(null);
          }}
        />
      )}
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        {currentStep !== 'destination' && (
          <button
            type="button"
            onClick={prevStep}
            disabled={isGenerating}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            Back
          </button>
        )}
        <div className={`${currentStep === 'destination' ? 'ml-auto' : ''}`}>
          <button
            type="button"
            onClick={nextStep}
            disabled={isGenerating}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {currentStep === 'preferences' ? 'Generate Itinerary' : 'Next'}
          </button>
        </div>
      </div>
      
      {/* Loading overlay and job status poller */}
      {renderLoadingState()}
    </div>
  );
} 