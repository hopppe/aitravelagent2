'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ErrorDisplay from '../ErrorDisplay';
import { validateItineraryStructure } from '../../lib/itinerary-validator';
import { processItineraryError, getItineraryTroubleshootingTips, logItineraryError } from '../../lib/itinerary-error-handler';

// Define the survey steps
type SurveyStep = 'destination' | 'dates' | 'purpose' | 'budget' | 'preferences' | 'specialRequests';

// Define preference categories and options - simplified
const preferenceOptions = [
  { id: 'nature', label: 'Nature & Outdoors' },
  { id: 'culture', label: 'Culture & Arts' },
  { id: 'food', label: 'Food & Dining' },
  { id: 'adventure', label: 'Adventure Activities' },
  { id: 'relaxation', label: 'Relaxation & Wellness' },
  { id: 'history', label: 'History & Landmarks' },
  { id: 'entertainment', label: 'Entertainment' },
];

// Define trip purpose options - simplified
const tripPurposeOptions = [
  { id: 'vacation', label: 'Vacation' },
  { id: 'honeymoon', label: 'Honeymoon' },
  { id: 'family', label: 'Family Trip' },
  { id: 'solo', label: 'Solo Adventure' },
  { id: 'business', label: 'Business Trip' },
];

// Budget range options - simplified with clearer descriptions
const budgetOptions = [
  { id: 'budget', label: 'Budget-friendly', description: 'Hostels, public transit, affordable dining' },
  { id: 'moderate', label: 'Moderate', description: 'Mid-range hotels, mix of restaurants' },
  { id: 'luxury', label: 'Luxury', description: 'Premium hotels, experiences, and dining' },
];

// Progress indicator component
function Progress({ currentStep }: { currentStep: SurveyStep }) {
  const steps = [
    { id: 'destination', label: 'Destination' },
    { id: 'dates', label: 'Dates' },
    { id: 'purpose', label: 'Purpose' },
    { id: 'budget', label: 'Budget' },
    { id: 'preferences', label: 'Interests' },
    { id: 'specialRequests', label: 'Requests' }
  ];
  
  // Calculate current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="flex justify-between md:px-4">
      {steps.map((step, index) => (
        <div 
          key={step.id} 
          className={`flex flex-col items-center ${index > 0 ? 'ml-1 md:ml-3' : ''}`}
        >
          <div 
            className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-sm md:text-base
              ${currentStep === step.id ? 'bg-primary text-white' : 
                index < currentStepIndex ? 
                'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
          >
            {index < currentStepIndex ? 
              '✓' : (index + 1)}
          </div>
          <span className="text-[10px] md:text-xs mt-1 md:mt-2 hidden sm:block">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

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
    specialRequests: '',
  });
  
  // Add loading and job tracking state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Force a page fresh load when initializing to clear any cached code/vars
  useEffect(() => {
    // Add a flag to session storage to prevent infinite refresh loop
    const refreshed = sessionStorage.getItem('form_refreshed');
    if (!refreshed) {
      sessionStorage.setItem('form_refreshed', 'true');
      // Hard refresh the page
      window.location.href = window.location.href;
    }
  }, []);

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
        setCurrentStep('specialRequests');
        break;
      case 'specialRequests':
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
      case 'specialRequests': setCurrentStep('preferences'); break;
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setErrorDetails(null);
      
      // Call the server-side API endpoint
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }));
        throw new Error(errorData.error || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.itinerary) {
        throw new Error(data.error || 'Invalid response format from server');
      }

      // Store and navigate to results - pass both itinerary and prompt
      handleStoreItineraryAndNavigate(data.itinerary, data.prompt);
      
    } catch (err) {
      // Process the error using our utility function
      const { errorMessage, details } = processItineraryError(err);
      
      setError(errorMessage);
      setErrorDetails(details);
      setIsGenerating(false);
      
      // Log the error for analytics
      logItineraryError(errorMessage, details, formData);
    }
  };
  
  // Store itinerary and navigate to results page
  const handleStoreItineraryAndNavigate = (itinerary: any, prompt?: string) => {
    try {
      // Validate the itinerary data more thoroughly
      if (!itinerary) {
        throw new Error('No itinerary received from server');
      }
      
      console.log('Validating itinerary structure', itinerary);
      
      // Use our validation utility
      const validatedItinerary = validateItineraryStructure(itinerary, formData);
      
      // Add the prompt to the validated itinerary object if provided
      if (prompt) {
        console.log('Adding prompt to itinerary data');
        validatedItinerary.prompt = prompt;
      }
      
      console.log('Itinerary validation successful');
      
      // Store in localStorage
      const itineraryJson = JSON.stringify(validatedItinerary);
      localStorage.setItem('generatedItinerary', itineraryJson);
      
      // Navigate to the generated trip page
      router.push('/trips/generated-trip');
    } catch (storageError) {
      console.error('Storage error:', storageError);
      console.error('Problematic itinerary:', itinerary);
      throw new Error('Failed to save itinerary data: ' + 
        (storageError instanceof Error ? storageError.message : 'Invalid itinerary structure received'));
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
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-base"
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
                  className="w-full p-4 text-base focus:ring-primary focus:border-primary calendar-input"
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
                  className="w-full p-4 text-base focus:ring-primary focus:border-primary calendar-input"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tripPurposeOptions.map(option => (
                <div
                  key={option.id}
                  className={`
                    p-4 border rounded-md cursor-pointer transition-all min-h-[44px]
                    ${formData.purpose === option.id 
                      ? 'border-primary bg-primary bg-opacity-10' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleRadioChange('purpose', option.id)}
                >
                  <div className="flex items-center">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <div 
                        className={`rounded-full ${formData.purpose === option.id ? 'h-4 w-4 bg-primary' : 'h-4 w-4 border border-gray-400'}`}
                      ></div>
                    </div>
                    <span className="ml-3 text-base font-medium text-gray-700">
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
            <div className="space-y-4">
              {budgetOptions.map(option => (
                <div
                  key={option.id}
                  className={`
                    p-4 border rounded-md cursor-pointer transition-all min-h-[60px]
                    ${formData.budget === option.id 
                      ? 'border-primary bg-primary bg-opacity-10' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleRadioChange('budget', option.id)}
                >
                  <div className="flex items-start">
                    <div className="h-5 w-5 mt-1 flex items-center justify-center">
                      <div 
                        className={`rounded-full ${formData.budget === option.id ? 'h-4 w-4 bg-primary' : 'h-4 w-4 border border-gray-400'}`}
                      ></div>
                    </div>
                    <div className="ml-3">
                      <span className="text-base font-medium text-gray-700">
                        {option.label}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
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
            <h2 className="text-xl font-semibold">What are you interested in?</h2>
            <p className="text-gray-600 text-sm">Select all that apply. This helps us personalize your trip.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {preferenceOptions.map(option => (
                <div
                  key={option.id}
                  className={`
                    p-4 border rounded-md cursor-pointer transition-all min-h-[44px]
                    ${formData.preferences.includes(option.id) 
                      ? 'border-primary bg-primary bg-opacity-10' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handlePreferenceToggle(option.id)}
                >
                  <div className="flex items-center">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <div 
                        className={`${formData.preferences.includes(option.id) 
                          ? 'h-4 w-4 bg-primary rounded-sm' 
                          : 'h-4 w-4 border border-gray-400 rounded-sm'}`}
                      ></div>
                    </div>
                    <span className="ml-3 text-base font-medium text-gray-700">
                      {option.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'specialRequests':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Any special requests?</h2>
            <p className="text-gray-600 text-sm">Let us know if you have specific activities or experiences in mind.</p>
            
            <div>
              <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests (Optional)
              </label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                className="w-full p-4 min-h-[120px] border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="Examples: 'I'd like to go hiking in the mountains', 'Include a food tour', 'Stay near the beach', etc."
              />
            </div>
          </div>
        );
    }
  };

  // Progress indicators
  const totalSteps = 6;
  const currentStepIndex = ['destination', 'dates', 'purpose', 'budget', 'preferences', 'specialRequests'].indexOf(currentStep) + 1;
  
  // Validate the current step
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 'destination':
        return !!formData.destination;
      case 'dates':
        return !!formData.startDate && !!formData.endDate;
      case 'purpose':
        return !!formData.purpose;
      case 'budget':
        return !!formData.budget;
      case 'preferences':
        return true; // Preferences are optional
      case 'specialRequests':
        return true; // Special requests are optional
      default:
        return false;
    }
  };
  
  // Render tips based on current step
  const renderTipsForStep = () => {
    switch (currentStep) {
      case 'destination':
        return (
          <ul className="list-disc pl-4 space-y-1">
            <li>Be specific with your destination for better results</li>
            <li>You can specify a city, country, or region</li>
            <li>For multi-city trips, choose your main destination</li>
          </ul>
        );
      case 'dates':
        return (
          <ul className="list-disc pl-4 space-y-1">
            <li>Longer trips will have more detailed itineraries</li>
            <li>Keep trips under 14 days for best results</li>
            <li>Consider weekday vs weekend differences</li>
          </ul>
        );
      case 'purpose':
        return (
          <ul className="list-disc pl-4 space-y-1">
            <li>Your trip purpose helps tailor the itinerary</li>
            <li>Business trips will include work-friendly schedules</li>
            <li>Family trips will include activities for all ages</li>
          </ul>
        );
      case 'budget':
        return (
          <ul className="list-disc pl-4 space-y-1">
            <li>Budget affects accommodation and activity choices</li>
            <li>Lower budgets will prioritize free/affordable options</li>
            <li>Luxury budgets will include premium experiences</li>
          </ul>
        );
      case 'preferences':
        return (
          <ul className="list-disc pl-4 space-y-1">
            <li>Select activities you enjoy most</li>
            <li>This helps us prioritize your itinerary</li>
            <li>We'll include a mix of your selections</li>
          </ul>
        );
      case 'specialRequests':
        return (
          <ul className="list-disc pl-4 space-y-1">
            <li>Be specific about activities you want</li>
            <li>Mention places you'd like to visit</li>
            <li>Include any accessibility needs</li>
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-3">
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Progress steps */}
          <div className="mb-6">
            <Progress currentStep={currentStep} />
          </div>
          
          {/* Form content */}
          {renderFormStep()}
          
          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between items-center">
            {currentStep !== 'destination' && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 bg-gray-200 rounded-md hover:bg-gray-300 min-w-[100px] min-h-[44px] text-base"
              >
                Back
              </button>
            )}
            <div></div> {/* Spacer for flex alignment */}
            <button
              type="button"
              onClick={nextStep}
              disabled={isGenerating || isCurrentStepValid() === false}
              className={`px-6 py-3 bg-primary text-white rounded-md min-w-[120px] min-h-[44px] text-base 
                ${isGenerating || isCurrentStepValid() === false ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
            >
              {currentStep === 'specialRequests' ? 'Generate Itinerary' : 'Next'}
            </button>
          </div>
          
          {/* Generation status indicators */}
          {isGenerating && (
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Generating your travel itinerary...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This may take up to 1-2 minutes as our AI crafts a detailed personalized itinerary
              </p>
            </div>
          )}
          
          {/* Error display */}
          {error && (
            <ErrorDisplay
              title="Itinerary Generation Error"
              message={error}
              details={errorDetails || undefined}
              suggestion="You can try again or modify your preferences to simplify the request."
              actions={[
                {
                  text: "Try Again",
                  fn: () => {
                    setError(null);
                    setErrorDetails(null);
                    handleSubmit(); // Retry immediately
                  },
                  isPrimary: true
                },
                {
                  text: "Dismiss",
                  fn: () => {
                    setError(null);
                    setErrorDetails(null);
                    setIsGenerating(false);
                  }
                }
              ]}
              troubleshootingTips={getItineraryTroubleshootingTips(error)}
              className="mt-4"
            />
          )}
        </div>
      </div>
      
      {/* Help sidebar */}
      <div className="md:col-span-1">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800">Trip Planning Tips</h3>
          <div className="mt-2 text-sm text-blue-700">
            {renderTipsForStep()}
          </div>
        </div>
      </div>
    </div>
  );
} 