'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCalendarAlt, FaMapMarkerAlt, FaImage } from 'react-icons/fa';

// Sample trips data
const sampleTrips = [
  {
    id: 'paris-weekend',
    title: 'Paris Weekend Getaway',
    destination: 'Paris, France',
    wikiTitle: 'Paris',
    dates: {
      start: '2025-04-24',
      end: '2025-04-28'
    },
  },
  {
    id: 'tokyo-adventure',
    title: 'Tokyo Adventure and Culture Quest',
    destination: 'Tokyo, Japan',
    wikiTitle: 'Tokyo',
    dates: {
      start: '2025-04-23',
      end: '2025-05-05'
    },
  },
  {
    id: 'bali-retreat',
    title: 'Bali Bliss Retreat',
    destination: 'Bali, Indonesia',
    wikiTitle: 'Bali',
    dates: {
      start: '2025-04-23',
      end: '2025-04-28'
    },
  },
];

// Trip data mapping
const tripDataMapping: Record<string, string> = {
  'paris-weekend': '/data/paris-weekend.json',
  'tokyo-adventure': '/data/tokyo-adventure.json',
  'bali-retreat': '/data/bali-retreat.json'
};

interface WikiImageData {
  title: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  description?: string;
  error?: boolean;
}

export default function SampleTrips() {
  const [tripImages, setTripImages] = useState<Record<string, WikiImageData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Fetch Wikipedia images on component mount
  useEffect(() => {
    const fetchImages = async () => {
      const imageData: Record<string, WikiImageData> = {};
      
      try {
        // Create an array of promises to fetch all images in parallel
        const promises = sampleTrips.map(async (trip) => {
          try {
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(trip.wikiTitle)}`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch image for ${trip.destination}`);
            }
            
            const data = await response.json();
            imageData[trip.id] = data;
          } catch (error) {
            console.error(`Error fetching image for ${trip.destination}:`, error);
            imageData[trip.id] = { 
              title: trip.destination,
              error: true 
            };
          }
        });
        
        // Wait for all fetch operations to complete
        await Promise.all(promises);
        setTripImages(imageData);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchImages();
  }, []);

  const handleImageError = (tripId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [tripId]: true
    }));
  };

  const formatDateString = (start: string, end: string) => {
    if (!start || !end) return '';
    
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      const options: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric'
      };
      
      // Add year if the dates are in different years
      if (startDate.getFullYear() !== endDate.getFullYear()) {
        options.year = 'numeric';
      }
      
      const formattedStart = startDate.toLocaleDateString('en-US', options);
      
      // Use full options for end date
      options.year = 'numeric';
      const formattedEnd = endDate.toLocaleDateString('en-US', options);
      
      return `${formattedStart} - ${formattedEnd}`;
    } catch (error) {
      return `${start.substring(0, 10)} - ${end.substring(0, 10)}`;
    }
  };

  const handleSampleTripClick = async (tripId: string) => {
    try {
      // Fetch the trip data from the JSON file
      const response = await fetch(tripDataMapping[tripId]);
      if (!response.ok) {
        throw new Error('Failed to load trip data');
      }
      
      const tripData = await response.json();
      
      // Mark this as an example trip
      tripData.isExample = true;
      
      // Ensure it doesn't have a saved_trip_id to prevent accidental overwrites
      delete tripData.saved_trip_id;
      
      // Clear any existing saved trip IDs from localStorage
      localStorage.removeItem('lastSavedTripId');
      
      // Store the selected trip in localStorage for the trip page to access
      localStorage.setItem('generatedItinerary', JSON.stringify(tripData));
    } catch (error) {
      console.error('Error loading sample trip:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sampleTrips.map((trip) => (
        <Link 
          key={trip.id} 
          href="/trips/generated-trip" 
          onClick={() => handleSampleTripClick(trip.id)} 
          className="block"
        >
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 w-full bg-gray-200">
              {!loading && tripImages[trip.id] && !imageErrors[trip.id] && !tripImages[trip.id].error ? (
                tripImages[trip.id].originalimage || tripImages[trip.id].thumbnail ? (
                  <Image
                    src={(tripImages[trip.id].originalimage?.source || tripImages[trip.id].thumbnail?.source) as string}
                    alt={trip.destination}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    onError={() => handleImageError(trip.id)}
                    priority={true}
                  />
                ) : (
                  <DefaultImagePlaceholder destination={trip.destination} />
                )
              ) : loading ? (
                <LoadingImagePlaceholder />
              ) : (
                <DefaultImagePlaceholder destination={trip.destination} />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
              <p className="flex items-center text-gray-600 text-sm mb-1">
                <FaMapMarkerAlt className="mr-1" /> {trip.destination}
              </p>
              <p className="flex items-center text-gray-600 text-sm">
                <FaCalendarAlt className="mr-1" /> {formatDateString(trip.dates.start, trip.dates.end)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function LoadingImagePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-200 animate-pulse">
      <span className="text-sm">Loading image...</span>
    </div>
  );
}

function DefaultImagePlaceholder({ destination }: { destination: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-100">
      <FaImage className="text-3xl mb-2" />
      <span className="text-sm text-center px-4">{destination}</span>
    </div>
  );
} 