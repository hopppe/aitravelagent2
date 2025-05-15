'use client';

import React, { useState, useEffect } from 'react';
import { FaBed, FaPlane, FaExternalLinkAlt, FaStar, FaMapMarkerAlt, FaDollarSign } from 'react-icons/fa';
import Image from 'next/image';
import { PlaceResult, getPriceLevelText } from '../../lib/google-places';

interface Accommodation {
  name: string;
  description: string;
  cost: number | string;
  coordinates: {
    lat: number;
    lng: number;
  };
  checkInOut?: 'check-in' | 'check-out' | 'staying';
  type?: string;
}

interface BookingOptionsProps {
  recommendedAccommodation: Accommodation;
  destination: string;
  budget?: string;
  allAccommodations?: Accommodation[]; // Add all accommodations from the trip
}

export default function BookingOptions({ 
  recommendedAccommodation, 
  destination,
  budget = 'moderate',
  allAccommodations = []
}: BookingOptionsProps) {
  const [alternativeOptions, setAlternativeOptions] = useState<PlaceResult[]>([]);
  const [enhancedRecommendation, setEnhancedRecommendation] = useState<PlaceResult | null>(null);
  const [enhancedAccommodations, setEnhancedAccommodations] = useState<Map<string, PlaceResult>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Format the destination for search queries
  const searchDestination = encodeURIComponent(destination);
  const accommodationName = encodeURIComponent(recommendedAccommodation.name);
  
  // Get unique accommodations from the trip (filter out duplicates by name)
  const uniqueAccommodations = React.useMemo(() => {
    console.log(`Processing accommodations for booking: received ${allAccommodations.length} accommodations`);
    
    // Create map to filter duplicates by name
    const accommodationMap = new Map<string, Accommodation>();
    
    // Add all accommodations from the trip
    if (allAccommodations && allAccommodations.length > 0) {
      allAccommodations.forEach((accommodation, index) => {
        if (accommodation && accommodation.name) {
          console.log(`Processing accommodation ${index + 1}/${allAccommodations.length}: ${accommodation.name}`);
          accommodationMap.set(accommodation.name, accommodation);
        } else {
          console.warn(`Skipping invalid accommodation at index ${index}`);
        }
      });
    } 
    // If allAccommodations is empty, include at least the recommended accommodation
    else if (recommendedAccommodation && recommendedAccommodation.name) {
      console.log(`No accommodations array provided, using recommended accommodation: ${recommendedAccommodation.name}`);
      accommodationMap.set(recommendedAccommodation.name, recommendedAccommodation);
    }
    
    const result = Array.from(accommodationMap.values());
    console.log(`Final unique accommodations count: ${result.length}`);
    return result;
  }, [allAccommodations, recommendedAccommodation]);
  
  // URL for recommended accommodation
  const recommendedUrl = `https://www.google.com/maps/search/?api=1&query=${recommendedAccommodation.coordinates.lat},${recommendedAccommodation.coordinates.lng}&query_place_id=${accommodationName}`;

  // Skyscanner and Kiwi URLs
  const skyscannerUrl = `https://www.skyscanner.com/transport/flights/${searchDestination}`;
  const kiwiUrl = `https://www.kiwi.com/en/search/results/${searchDestination}`;

  // Determine if this is a budget trip
  const isBudgetTrip = budget.toLowerCase() === 'budget' || budget.toLowerCase() === 'low';

  useEffect(() => {
    async function fetchAccommodationOptions() {
      try {
        console.log(`Starting to fetch accommodation data for ${uniqueAccommodations.length} accommodations`);
        
        // Process each accommodation to get enhanced details
        const enhancedAccommodationsMap = new Map<string, PlaceResult>();
        
        // Create an array to store each accommodation fetch promise
        const accommodationFetchPromises = uniqueAccommodations.map(async (accommodation) => {
          if (!accommodation || !accommodation.coordinates) {
            console.warn('Skipping accommodation with missing coordinates:', accommodation?.name);
            return null;
          }
          
          const { lat, lng } = accommodation.coordinates;
          
          // Ensure we have valid coordinates
          if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
            console.error('Invalid coordinates for accommodation:', accommodation.name, lat, lng);
            return null;
          }
          
          // For debugging
          console.log(`Fetching details for accommodation: ${accommodation.name}`);
          console.log('- Location:', lat, lng);
          console.log('- Budget level:', budget);
          
          try {
            // Try to find the accommodation using text search with precise name and location
            const keywordQuery = encodeURIComponent(accommodation.name);
            const specificApiUrl = `/api/places?lat=${lat}&lng=${lng}&type=lodging&radius=1000&keyword=${keywordQuery}`;
            
            const specificResponse = await fetch(specificApiUrl, {
              cache: 'no-store' 
            });
            
            if (specificResponse.ok) {
              const specificData = await specificResponse.json();
              if (specificData.places && specificData.places.length > 0) {
                // First try exact match, then fuzzy match
                let matchingPlace = specificData.places.find((place: PlaceResult) => 
                  place.name.toLowerCase() === accommodation.name.toLowerCase()
                );
                
                // If no exact match, try fuzzy match
                if (!matchingPlace) {
                  matchingPlace = specificData.places.find((place: PlaceResult) => 
                    place.name.toLowerCase().includes(accommodation.name.toLowerCase()) ||
                    accommodation.name.toLowerCase().includes(place.name.toLowerCase())
                  );
                }
                
                // If we found a match, save it
                if (matchingPlace) {
                  console.log(`Found enhanced details for accommodation: ${accommodation.name}`);
                  enhancedAccommodationsMap.set(accommodation.name, matchingPlace);
                  return { accommodation, matchingPlace };
                }
              }
            }
            
            // Fall back to searching by name only if the precise search failed
            const fallbackApiUrl = `/api/places?lat=${lat}&lng=${lng}&type=lodging&radius=5000&keyword=${encodeURIComponent(accommodation.name)}`;
            
            const fallbackResponse = await fetch(fallbackApiUrl, {
              cache: 'no-store' 
            });
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              if (fallbackData.places && fallbackData.places.length > 0) {
                const fallbackMatch = fallbackData.places[0]; // Just use the first result as a fallback
                console.log(`Using fallback match for ${accommodation.name}: ${fallbackMatch.name}`);
                enhancedAccommodationsMap.set(accommodation.name, fallbackMatch);
                return { accommodation, matchingPlace: fallbackMatch };
              }
            }
            
            console.log(`No enhanced details found for accommodation: ${accommodation.name}`);
            return { accommodation, matchingPlace: null };
          } catch (error) {
            console.error(`Error fetching details for ${accommodation.name}:`, error);
            return null;
          }
        });
        
        // Wait for all accommodation fetch operations to complete
        const results = await Promise.all(accommodationFetchPromises);
        
        // Set the enhanced recommendation (the first valid one)
        const firstValidResult = results.find(result => result && result.matchingPlace);
        if (firstValidResult && firstValidResult.matchingPlace) {
          console.log(`Setting ${firstValidResult.accommodation.name} as enhanced recommendation`);
          setEnhancedRecommendation(firstValidResult.matchingPlace);
        }
        
        // Update the map with all enhanced accommodations
        setEnhancedAccommodations(enhancedAccommodationsMap);
        
        // Now fetch alternative accommodations in the area
        // Use the first valid accommodation's coordinates as a reference point
        const referenceAccommodation = uniqueAccommodations.find(acc => 
          acc && acc.coordinates && 
          !isNaN(acc.coordinates.lat) && !isNaN(acc.coordinates.lng) &&
          isFinite(acc.coordinates.lat) && isFinite(acc.coordinates.lng)
        );
        
        if (!referenceAccommodation) {
          setError('No valid accommodation coordinates found');
          setIsLoading(false);
          return;
        }
        
        const { lat, lng } = referenceAccommodation.coordinates;
        
        // For budget trips, include hostels in the search
        const accommodationType = isBudgetTrip ? 'hostel' : 'lodging';
        const keyword = isBudgetTrip 
          ? `${destination} hostels budget accommodation`
          : `${destination} hotels`;
        
        const apiUrl = `/api/places?lat=${lat}&lng=${lng}&type=${accommodationType}&budget=${encodeURIComponent(budget)}&radius=10000&keyword=${encodeURIComponent(keyword)}`;
        
        console.log(`Making request for alternatives: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          let errorMessage = `API error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
          } catch (e) {
            // If we can't parse the JSON, just use the status code
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (!data.places || !Array.isArray(data.places)) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format from places API');
        }
        
        console.log(`Found ${data.places.length} alternative accommodations`);
        
        // Filter out options with the same name as any of our selected accommodations
        // and also filter out places with low ratings
        const accommodationNames = uniqueAccommodations.map(acc => acc.name.toLowerCase());
        const filteredOptions = data.places
          .filter((place: PlaceResult) => 
            !accommodationNames.some(name => place.name.toLowerCase().includes(name) || name.includes(place.name.toLowerCase())) && 
            place.rating >= 3.0
          )
          .sort((a: PlaceResult, b: PlaceResult) => b.rating - a.rating) // Sort by rating (highest first)
          .slice(0, 6); // Limit to 6 alternatives
        
        console.log(`Showing ${filteredOptions.length} filtered accommodations`);
        
        setAlternativeOptions(filteredOptions);
      } catch (error) {
        console.error('Error fetching accommodation options:', error);
        setError(error instanceof Error ? error.message : 'Failed to load alternative accommodations');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAccommodationOptions();
  }, [uniqueAccommodations, destination, budget, recommendedAccommodation.name, isBudgetTrip]);

  // Render price level as dollar signs
  const renderPriceLevel = (priceLevel?: number) => {
    if (priceLevel === undefined) return 'Price not available';
    
    const dollars = [];
    for (let i = 0; i < 5; i++) {
      dollars.push(
        <FaDollarSign 
          key={i} 
          className={i < priceLevel ? 'text-green-600' : 'text-gray-300'} 
        />
      );
    }
    
    return <div className="flex items-center">{dollars}</div>;
  };

  // Generate Google Maps URL
  const createGoogleMapsLink = (place: PlaceResult) => {
    return place.url || `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`;
  };

  // Create accommodation card for the horizontal scroll list
  const renderAccommodationCard = (accommodation: Accommodation) => {
    const enhancedData = enhancedAccommodations.get(accommodation.name);
    let mapUrl: string;

    if (enhancedData && enhancedData.url) {
      // 1. Use the URL from the Places API result if available (should be the most accurate)
      mapUrl = enhancedData.url;
    } else if (enhancedData && enhancedData.id) {
      // 2. If API URL is missing but we have a Place ID, use it
      mapUrl = `https://www.google.com/maps/search/?api=1&query_place_id=${enhancedData.id}`;
    } else {
      // 3. Fallback: If no enhanced data or no Place ID, search by name and original coordinates.
      const query = encodeURIComponent(`${accommodation.name}, ${accommodation.coordinates.lat},${accommodation.coordinates.lng}`);
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    }

    return (
      <div key={accommodation.name} className="flex-shrink-0 w-64 border rounded-lg p-3 hover:shadow-md transition-shadow">
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="relative bg-gray-100 rounded-lg w-full h-32 mb-2">
            {enhancedData?.photos && enhancedData.photos[0] ? (
              <Image
                src={enhancedData.photos[0]}
                alt={accommodation.name}
                fill
                sizes="(max-width: 640px) 100vw, 256px"
                className="object-cover rounded-lg"
                loading="lazy"
                onError={(e) => {
                  console.error(`Error loading image for ${accommodation.name}`);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><div class="text-xl text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div></div>';
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaBed className="text-xl text-gray-400" />
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold text-xs uppercase mb-1 text-primary">
              {accommodation.checkInOut === 'check-in' ? 'Check-in' : 
               accommodation.checkInOut === 'check-out' ? 'Check-out' : 
               accommodation.checkInOut === 'staying' ? 'Staying' : 'Accommodation'}
            </h4>
            
            <h5 className="font-medium text-sm">{accommodation.name}</h5>
            <p className="text-xs text-gray-600 mb-1 line-clamp-1">{accommodation.description}</p>
            
            {enhancedData?.rating && enhancedData.rating > 0 && (
              <div className="flex items-center gap-1 text-yellow-500 text-xs">
                <FaStar /> <span>{enhancedData.rating.toFixed(1)}</span>
                <span className="text-gray-500">
                  ({enhancedData.userRatingsTotal.toLocaleString()})
                </span>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-1 mt-1">
              <span className="text-primary font-medium text-xs">
                {typeof accommodation.cost === 'number'
                  ? `$${accommodation.cost.toFixed(2)}`
                  : accommodation.cost}
              </span>
              {enhancedData?.priceLevel !== undefined && (
                <div className="text-xs flex items-center gap-1">
                  {renderPriceLevel(enhancedData.priceLevel)}
                  <span className="text-gray-600">({getPriceLevelText(enhancedData.priceLevel)})</span>
                </div>
              )}
            </div>
          </div>
        </a>
      </div>
    );
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Book Your Trip</h2>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Accommodation Booking Options */}
        <div className="space-y-4">
          <div className="border-b pb-2 mb-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FaBed className="text-primary" /> Book Your Accommodation
            </h3>
          </div>
          
          {/* Trip Accommodations */}
          {uniqueAccommodations.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm uppercase mb-2 text-primary">Your Trip Accommodations</h4>
              
              {/* Horizontal scrolling list */}
              <div className="flex overflow-x-auto pb-2 space-x-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {uniqueAccommodations.map(renderAccommodationCard)}
              </div>
            </div>
          )}
          
          {/* Alternative Accommodation Options from Google Places */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm uppercase mb-2 text-gray-600">
              {isBudgetTrip ? 'Budget-Friendly Alternatives' : 'Alternative Options'}
            </h4>
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading nearby accommodations...</div>
            ) : error ? (
              <div className="text-sm text-red-500">{error}</div>
            ) : alternativeOptions.length === 0 ? (
              <div className="text-sm text-gray-500">No alternative accommodations found nearby.</div>
            ) : (
              <div className="flex overflow-x-auto pb-2 space-x-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {alternativeOptions.map((place) => (
                  <a
                    key={place.id}
                    href={createGoogleMapsLink(place)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-64 border rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="relative bg-gray-100 rounded-lg w-full h-32 mb-2">
                      {place.photos && place.photos[0] ? (
                        <Image
                          src={place.photos[0]}
                          alt={place.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 256px"
                          className="object-cover rounded-lg"
                          loading="lazy"
                          onError={(e) => {
                            console.error(`Error loading image for alternative: ${place.name}`);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><div class="text-xl text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div></div>';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaBed className="text-xl text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">{place.name}</h5>
                      <p className="text-xs text-gray-600 mb-1 line-clamp-1">{place.address}</p>
                      {place.rating > 0 && (
                        <div className="flex items-center gap-1 text-yellow-500 text-xs">
                          <FaStar /> <span>{place.rating.toFixed(1)}</span>
                          <span className="text-gray-500">
                            ({place.userRatingsTotal.toLocaleString()})
                          </span>
                        </div>
                      )}
                      {place.priceLevel !== undefined && (
                        <div className="text-xs flex items-center gap-1 mt-1">
                          {renderPriceLevel(place.priceLevel)}
                          <span className="text-gray-600">({getPriceLevelText(place.priceLevel)})</span>
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Flight Booking Options */}
        <div className="space-y-4">
          <div className="border-b pb-2 mb-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FaPlane className="text-primary" /> Book Your Flights
            </h3>
          </div>
          
          <a
            href={skyscannerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <FaPlane className="text-blue-500 mr-3" />
              <div>
                <h4 className="font-medium">Skyscanner</h4>
                <p className="text-xs text-gray-600">Compare flights across airlines</p>
              </div>
            </div>
            <FaExternalLinkAlt className="text-gray-400" />
          </a>
          
          <a
            href={kiwiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <FaPlane className="text-green-500 mr-3" />
              <div>
                <h4 className="font-medium">Kiwi.com</h4>
                <p className="text-xs text-gray-600">Find the best flight deals</p>
              </div>
            </div>
            <FaExternalLinkAlt className="text-gray-400" />
          </a>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Note: We are not affiliated with any of these booking services. Links open in a new tab with prefilled search criteria.
      </p>
    </div>
  );
} 