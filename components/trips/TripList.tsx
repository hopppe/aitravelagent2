'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabaseAuth } from '../../lib/auth';
import { useTripPhoto } from '../../hooks/use-trip-photo';

// Define the Trip type
interface Trip {
  id: string;
  title: string;
  destination: string;
  dates: {
    start: string | null;
    end: string | null;
  };
  days: number;
  created_at: string;
  updated_at: string;
}

interface TripListProps {
  redirectIfUnauthenticated?: boolean;
}

export default function TripList({ redirectIfUnauthenticated = false }: TripListProps) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();
  
  // Fetch user trips from the API
  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) {
        console.log('TripList: No user found, skipping trip fetch');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('TripList: User authenticated, getting session token');
        // Get auth session from Supabase
        const { data: sessionData } = await supabaseAuth.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        
        if (!accessToken) {
          console.log('TripList: No access token available despite user being logged in');
          setTrips([]);
          setLoading(false);
          return;
        }
        
        console.log('TripList: Got access token, fetching trips');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        };
        
        const response = await fetch('/api/user-trips', {
          method: 'GET',
          headers,
        });
        
        const data = await response.json();
        console.log('TripList: API response status:', response.status);
        
        if (!response.ok) {
          console.error('TripList: API error response:', data);
          throw new Error(data.error || `Error: ${response.status}`);
        }
        
        if (data && Array.isArray(data.trips)) {
          console.log(`TripList: Received ${data.trips.length} trips from API`);
          setTrips(data.trips);
        } else {
          console.log('TripList: No trips array in response, setting empty trips');
          setTrips([]);
        }
      } catch (error) {
        console.error("TripList: Error fetching trips:", error);
        // Don't show authentication errors to the user
        if (error instanceof Error && 
            (error.message.includes('Authentication required') || 
             error.message.includes('Authentication error'))) {
          console.warn('TripList: Authentication issue when fetching trips, showing empty state');
          setTrips([]);
        } else {
          setError(error instanceof Error ? error.message : 'Failed to load trips');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrips();
  }, [user]);
  
  // Format date range for display
  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 'No dates specified';
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const options: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric'
      };
      
      // Add year if different years
      if (start.getFullYear() !== end.getFullYear()) {
        options.year = 'numeric';
      }
      
      const formattedStart = start.toLocaleDateString('en-US', options);
      
      // Use full options for end date
      options.year = 'numeric';
      const formattedEnd = end.toLocaleDateString('en-US', options);
      
      return `${formattedStart} - ${formattedEnd}`;
    } catch (e) {
      return `${startDate} - ${endDate}`;
    }
  };
  
  // If no user is signed in and redirectIfUnauthenticated is true, redirect to auth page
  useEffect(() => {
    if (!user && !loading && redirectIfUnauthenticated) {
      console.log('TripList: No user and redirectIfUnauthenticated=true, redirecting to /auth');
      router.push('/auth');
    }
  }, [user, loading, router, redirectIfUnauthenticated]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading your trips...</p>
      </div>
    );
  }
  
  // Delete trip handler
  async function handleDeleteTrip(tripId: string) {
    if (!user) return;
    setDeletingId(tripId);
    setDeleteError(null);
    try {
      // Get auth session from Supabase
      const { data: sessionData } = await supabaseAuth.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('No access token');
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to delete trip');
      // Remove trip from state
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete trip');
    } finally {
      setDeletingId(null);
    }
  }
  
  // Show error state (only for non-authentication errors)
  if (error || deleteError) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-500">Error: {error || deleteError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-md transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Return message for unauthenticated users if not redirecting
  if (!user && !redirectIfUnauthenticated) {
    console.log('TripList: No user and not redirecting, showing sign-in prompt');
    return (
      <div className="text-center py-12 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-medium text-gray-700 mb-2">Sign in to view your trips</h3>
        <p className="text-gray-500 mb-6">Create an account to start planning your adventures</p>
        <Link 
          href="/auth" 
          className="inline-flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-md transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }
  
  // Return null while we redirect if not signed in
  if (!user && redirectIfUnauthenticated) {
    return null;
  }

  // Handle empty state when user is signed in but has no trips
  if (trips.length === 0) {
    console.log('TripList: User is signed in but has no trips');
    return (
      <div className="text-center py-12 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-medium text-gray-700 mb-2">You haven't created any trips yet</h3>
        <p className="text-gray-500 mb-6">Start planning your first adventure</p>
        <Link 
          href="/trips/new" 
          className="inline-flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-md transition-all"
        >
          Create Your First Trip
        </Link>
      </div>
    );
  }

  // Log trip count
  console.log(`[TripList] Rendering ${trips.length} trips`);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip) => {
        console.log(`[TripList] Trip data: id=${trip.id}, destination="${trip.destination || 'undefined'}"`);
        return (
          <div key={trip.id} className="relative group">
            {/* Card links to trip details */}
            <Link 
              href={`/trips/generated-trip?id=${trip.id}`} 
              className="block"
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 w-full bg-gray-200">
                  {trip.destination && trip.destination.trim() !== '' ? (
                    <TripPhoto destination={trip.destination} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <span className="text-gray-500 font-medium text-center">No destination specified</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-800 truncate">{trip.title}</h3>
                  <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                    <FaMapMarkerAlt className="text-primary" />
                    <span className="truncate">{trip.destination}</span>
                  </div>
                  {trip.dates.start && trip.dates.end && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                      <FaCalendarAlt className="text-primary" /> 
                      <span>{formatDateRange(trip.dates.start, trip.dates.end)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
            {/* Delete button (subtle X, Apple style, only turns red on direct hover/focus) */}
            <button
              aria-label="Delete trip"
              disabled={deletingId === trip.id}
              onClick={() => handleDeleteTrip(trip.id)}
              className={
                `absolute top-2 right-2 z-10 flex items-center justify-center
                rounded-full transition-colors
                w-11 h-11 min-w-[44px] min-h-[44px]
                bg-transparent
                hover:bg-red-50 focus:bg-red-100
                border-none
                opacity-80 hover:opacity-100 focus:opacity-100 disabled:opacity-50`
              }
              style={{ pointerEvents: deletingId === trip.id ? 'none' : 'auto' }}
            >
              {deletingId === trip.id ? (
                <span className="w-5 h-5 block animate-spin border-2 border-gray-400 border-t-transparent rounded-full"></span>
              ) : (
                // Only the icon turns red on direct hover/focus
                <FiX className="w-6 h-6 text-gray-400 hover:text-red-500 focus:text-red-600 transition-colors" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function TripPhoto({ destination }: { destination: string }) {
  // Add a secure destination with fallback
  const secureDestination = typeof destination === 'string' && destination.trim() !== '' 
    ? destination.trim() 
    : 'Unknown Location';
  
  // Add debug logging for the destination value
  console.log(`[TripPhoto] Rendering photo for destination: "${secureDestination}"`);
  
  const { photoUrl, isLoading, hasError } = useTripPhoto(secureDestination);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Reset error state when destination or photoUrl changes
    setError(false);
  }, [secureDestination, photoUrl]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse">
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  // If there's no photo URL or an error occurred, show the destination name
  if (hasError || !photoUrl || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
        <span className="text-gray-500 font-medium text-center px-4">{secureDestination}</span>
        {(hasError || error) && <span className="text-xs text-gray-400 mt-1">Could not load image</span>}
      </div>
    );
  }

  // Handle the case where the photo URL is there but might be invalid
  return (
    <Image
      src={photoUrl}
      alt={`Photo of ${secureDestination}`}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      loading="lazy"
      priority={false}
      quality={85}
      // Add an onError handler to show fallback when image fails to load
      onError={() => {
        console.error(`[TripPhoto] Error loading image for ${secureDestination}`);
        setError(true);
      }}
    />
  );
} 