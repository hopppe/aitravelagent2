'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

// Define the Trip type
interface Trip {
  id: string;
  title: string;
  destination: string;
  dates: string;
  image: string;
}

interface TripListProps {
  redirectIfUnauthenticated?: boolean;
}

// Mock data - will be replaced with real data from API
const mockTrips: Trip[] = [
  {
    id: '1',
    title: 'Paris Weekend Getaway',
    destination: 'Paris, France',
    dates: 'Oct 15 - Oct 18, 2023',
    image: '/images/paris.jpg',
  },
  {
    id: '2',
    title: 'Tokyo Adventure',
    destination: 'Tokyo, Japan',
    dates: 'Nov 5 - Nov 15, 2023',
    image: '/images/tokyo.jpg',
  },
  {
    id: '3',
    title: 'Bali Retreat',
    destination: 'Bali, Indonesia',
    dates: 'Dec 20 - Dec 30, 2023',
    image: '/images/bali.jpg',
  },
];

export default function TripList({ redirectIfUnauthenticated = false }: TripListProps) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Simulate fetching user trips
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        // In a real implementation, this would fetch trips from an API
        // For now, we'll just use the mock data if the user is signed in
        if (user) {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          setTrips(mockTrips);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching trips:", error);
        setLoading(false);
      }
    };
    
    fetchTrips();
  }, [user]);
  
  // If no user is signed in and redirectIfUnauthenticated is true, redirect to auth page
  useEffect(() => {
    if (!user && !loading && redirectIfUnauthenticated) {
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
  
  // Return message for unauthenticated users if not redirecting
  if (!user && !redirectIfUnauthenticated) {
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
        <Link key={trip.id} href={`/trips/${trip.id}`} className="block">
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 w-full">
              <div className="absolute inset-0 bg-gray-500 flex items-center justify-center text-white">
                {/* Placeholder for when images are missing */}
                <span className="text-sm">Image Placeholder</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
              <p className="flex items-center text-gray-600 text-sm mb-1">
                <FaMapMarkerAlt className="mr-1" /> {trip.destination}
              </p>
              <p className="flex items-center text-gray-600 text-sm">
                <FaCalendarAlt className="mr-1" /> {trip.dates}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 