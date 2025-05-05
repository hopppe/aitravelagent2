'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabaseAuth } from '../../lib/auth';

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
  
  // Show error state (only for non-authentication errors)
  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-500">Error: {error}</p>
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip) => (
        <Link 
          key={trip.id} 
          href={`/trips/generated-trip?id=${trip.id}`} 
          className="block"
        >
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 w-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 font-medium">{trip.destination}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
              <p className="flex items-center text-gray-600 text-sm mb-1">
                <FaMapMarkerAlt className="mr-1" /> {trip.destination}
              </p>
              <p className="flex items-center text-gray-600 text-sm mb-1">
                <FaCalendarAlt className="mr-1" /> {formatDateRange(trip.dates.start, trip.dates.end)}
              </p>
              <p className="text-gray-600 text-sm">
                {trip.days} {trip.days === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 