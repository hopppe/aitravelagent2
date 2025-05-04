'use client';

/**
 * @deprecated This component has been deprecated and its functionality has been moved to BookingOptions.
 * Please use BookingOptions component instead. This component will be removed in a future update.
 */

import React, { useState, useEffect } from 'react';
import { FaBed, FaStar, FaMapMarkerAlt, FaExternalLinkAlt, FaDollarSign } from 'react-icons/fa';
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

interface AccommodationOptionsProps {
  recommendedAccommodation: Accommodation;
  destination: string;
  budget: string;
}

export default function AccommodationOptions({
  recommendedAccommodation,
  destination,
  budget
}: AccommodationOptionsProps) {
  const [alternativeOptions, setAlternativeOptions] = useState<PlaceResult[]>([]);
  const [enhancedRecommendation, setEnhancedRecommendation] = useState<PlaceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccommodationOptions() {
      if (!recommendedAccommodation || !recommendedAccommodation.coordinates) {
        setError('No valid recommended accommodation coordinates found');
        setIsLoading(false);
        return;
      }

      try {
        const { lat, lng } = recommendedAccommodation.coordinates;
        
        // Ensure we have valid coordinates
        if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
          console.error('Invalid coordinates:', lat, lng);
          setError('Invalid accommodation coordinates');
          setIsLoading(false);
          return;
        }
        
        // For debugging
        console.log('Fetching nearby accommodations:');
        console.log('- Location:', lat, lng);
        console.log('- Budget level:', budget);
        
        // First, try to find the recommended accommodation in the Places API
        // This helps us get additional details like photos, ratings, etc.
        const recommendedName = recommendedAccommodation.name;
        const specificApiUrl = `/api/places?lat=${lat}&lng=${lng}&type=lodging&budget=${encodeURIComponent(budget)}&radius=1000&keyword=${encodeURIComponent(recommendedName)}`;
        
        console.log('Looking up recommended accommodation details:', specificApiUrl);
        
        // Fetch specific details for the recommended place
        const specificResponse = await fetch(specificApiUrl, {
          cache: 'no-store' 
        });
        
        if (specificResponse.ok) {
          const specificData = await specificResponse.json();
          if (specificData.places && specificData.places.length > 0) {
            const matchingPlace = specificData.places.find((place: PlaceResult) => 
              place.name.toLowerCase().includes(recommendedName.toLowerCase()) ||
              recommendedName.toLowerCase().includes(place.name.toLowerCase())
            );
            
            if (matchingPlace) {
              console.log('Found enhanced details for recommended accommodation:', matchingPlace.name);
              setEnhancedRecommendation(matchingPlace);
            }
          }
        }
        
        // Now fetch alternative accommodations in the area
        const apiUrl = `/api/places?lat=${lat}&lng=${lng}&type=lodging&budget=${encodeURIComponent(budget)}&radius=10000&keyword=${encodeURIComponent(destination)}`;
        
        console.log('Making request for alternatives:', apiUrl);
        
        const response = await fetch(apiUrl, {
          cache: 'no-store'
        });
        console.log('Response status:', response.status);
        
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
        
        // Filter out options with the same name as the recommended accommodation
        // and also filter out places with low ratings
        const filteredOptions = data.places
          .filter((place: PlaceResult) => 
            place.name.toLowerCase() !== recommendedAccommodation.name.toLowerCase() && 
            place.rating >= 3.0
          )
          .sort((a: PlaceResult, b: PlaceResult) => b.rating - a.rating) // Sort by rating (highest first)
          .slice(0, 4); // Limit to 4 alternatives
        
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
  }, [recommendedAccommodation, destination, budget]);

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

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaBed className="text-primary" /> Accommodation Options
      </h2>

      {/* AI Recommended Accommodation */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">AI Recommended</h3>
        
        {enhancedRecommendation ? (
          <a
            href={enhancedRecommendation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="relative bg-gray-100 rounded-lg flex items-center justify-center w-full md:w-40 h-32 flex-shrink-0">
                {enhancedRecommendation.photos && enhancedRecommendation.photos[0] ? (
                  <Image
                    src={enhancedRecommendation.photos[0]}
                    alt={enhancedRecommendation.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 160px"
                    className="object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-12 h-12 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>';
                      }
                    }}
                  />
                ) : (
                  <FaBed className="text-4xl text-gray-400" />
                )}
              </div>
              <div className="flex-grow">
                <h4 className="font-medium text-lg">{recommendedAccommodation.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{recommendedAccommodation.description}</p>
                
                {enhancedRecommendation.rating > 0 && (
                  <div className="flex items-center gap-1 text-yellow-500 text-sm mb-2">
                    <FaStar /> <span>{enhancedRecommendation.rating.toFixed(1)}</span>
                    <span className="text-gray-500">
                      ({enhancedRecommendation.userRatingsTotal.toLocaleString()} reviews)
                    </span>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                  <span className="text-primary font-medium">
                    {typeof recommendedAccommodation.cost === 'number'
                      ? `$${recommendedAccommodation.cost.toFixed(2)}`
                      : recommendedAccommodation.cost}
                  </span>
                  {enhancedRecommendation.priceLevel !== undefined && (
                    <div className="flex items-center">
                      {renderPriceLevel(enhancedRecommendation.priceLevel)}
                    </div>
                  )}
                  <span className="text-sm text-blue-600 flex items-center gap-1">
                    <FaMapMarkerAlt /> View on Google Maps <FaExternalLinkAlt className="text-xs" />
                  </span>
                </div>
              </div>
            </div>
          </a>
        ) : (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${recommendedAccommodation.coordinates.lat},${recommendedAccommodation.coordinates.lng}&query_place_id=${encodeURIComponent(recommendedAccommodation.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="bg-gray-100 rounded-lg flex items-center justify-center w-full md:w-40 h-32 flex-shrink-0">
                <FaBed className="text-4xl text-gray-400" />
              </div>
              <div className="flex-grow">
                <h4 className="font-medium text-lg">{recommendedAccommodation.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{recommendedAccommodation.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                  <span className="text-primary font-medium">
                    {typeof recommendedAccommodation.cost === 'number'
                      ? `$${recommendedAccommodation.cost.toFixed(2)}`
                      : recommendedAccommodation.cost}
                  </span>
                  <span className="text-sm text-blue-600 flex items-center gap-1">
                    <FaMapMarkerAlt /> View on map <FaExternalLinkAlt className="text-xs" />
                  </span>
                </div>
              </div>
            </div>
          </a>
        )}
      </div>

      {/* Alternative Options */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Other Options Nearby</h3>
        
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && !isLoading && (
          <div className="text-center py-4 text-red-500">{error}</div>
        )}
        
        {!isLoading && !error && alternativeOptions.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No alternative options found
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alternativeOptions.map((place) => (
            <a
              key={place.id}
              href={createGoogleMapsLink(place)}
              target="_blank"
              rel="noopener noreferrer"
              className="block border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col h-full">
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative bg-gray-100 rounded-lg flex items-center justify-center w-full sm:w-32 h-24 flex-shrink-0">
                      {place.photos && place.photos[0] ? (
                        <Image
                          src={place.photos[0]}
                          alt={place.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 128px"
                          className="object-cover rounded-lg"
                          onError={(e) => {
                            // If image fails to load, replace with placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const icon = document.createElement('div');
                              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="text-3xl text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';
                              parent.appendChild(icon);
                            }
                          }}
                        />
                      ) : (
                        <FaBed className="text-3xl text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{place.name}</h4>
                      <p className="text-sm text-gray-600 mb-1 line-clamp-2">{place.address}</p>
                      <div className="flex items-center gap-1 text-yellow-500 text-sm mb-1">
                        <FaStar /> <span>{place.rating.toFixed(1)}</span>
                        <span className="text-gray-500">({place.userRatingsTotal.toLocaleString()} reviews)</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {place.priceLevel !== undefined ? (
                          <div className="flex items-center gap-2">
                            {renderPriceLevel(place.priceLevel)}
                            <span>{getPriceLevelText(place.priceLevel)}</span>
                          </div>
                        ) : (
                          <span>Price not available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <span className="text-sm text-blue-600 flex items-center gap-1">
                    <FaExternalLinkAlt className="text-xs" /> View on Google Maps
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
      
      {/* Disclaimer */}
      <p className="text-xs text-gray-500 mt-6">
        Note: Alternative options are powered by Google Places API and may not be available in all areas. Prices shown are estimates and may vary.
      </p>
    </div>
  );
} 