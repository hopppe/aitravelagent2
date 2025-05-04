'use client';

import React, { useEffect } from 'react';
import { FaBed } from 'react-icons/fa';
import BookingOptions from './BookingOptions';

type Accommodation = {
  name: string;
  description: string;
  cost: number | string;
  coordinates: {
    lat: number;
    lng: number;
  };
  checkInOut?: 'check-in' | 'check-out' | 'staying';
  type?: string;
};

interface BookingServicesProps {
  destination: string;         // Destination name for searches
  startDate: string;           // ISO date string
  endDate: string;             // ISO date string
  accommodation?: Accommodation; // Recommended accommodation from itinerary
  allAccommodations?: Accommodation[]; // All accommodations from the itinerary
  budget?: string;             // Budget level: 'budget', 'moderate', 'luxury'
}

export default function BookingServices({ 
  destination, 
  startDate, 
  endDate, 
  accommodation,
  allAccommodations = [],
  budget = 'moderate'
}: BookingServicesProps) {
  // Log accommodation data for debugging
  useEffect(() => {
    if (accommodation) {
      console.log('BookingServices: Received accommodation data:', accommodation);
    } else {
      console.log('BookingServices: No accommodation data provided');
    }
    
    if (allAccommodations && allAccommodations.length > 0) {
      console.log(`BookingServices: Received ${allAccommodations.length} accommodations`);
    }
  }, [accommodation, allAccommodations]);

  // Check if we have valid accommodation data with coordinates
  const hasValidAccommodation = 
    accommodation && 
    accommodation.coordinates && 
    typeof accommodation.coordinates.lat === 'number' && 
    typeof accommodation.coordinates.lng === 'number' &&
    !isNaN(accommodation.coordinates.lat) && 
    !isNaN(accommodation.coordinates.lng);
  
  // Check if we have valid accommodations in the allAccommodations array
  const hasValidAccommodations = 
    allAccommodations && 
    allAccommodations.length > 0 && 
    allAccommodations.some(acc => 
      acc && 
      acc.coordinates && 
      typeof acc.coordinates.lat === 'number' && 
      typeof acc.coordinates.lng === 'number' &&
      !isNaN(acc.coordinates.lat) && 
      !isNaN(acc.coordinates.lng)
    );
  
  return (
    <div className="space-y-8">
      {(hasValidAccommodation || hasValidAccommodations) ? (
        <BookingOptions
          recommendedAccommodation={accommodation || allAccommodations[0]}
          allAccommodations={allAccommodations.length > 0 ? allAccommodations : (accommodation ? [accommodation] : [])}
          destination={destination}
          budget={budget}
        />
      ) : (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Book Your Trip</h2>
          <div className="border-b pb-2 mb-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FaBed className="text-primary" /> Book Your Accommodation
            </h3>
          </div>
          <p className="text-gray-600">
            No accommodation information is available for this trip or location coordinates are missing.
          </p>
        </div>
      )}
    </div>
  );
} 