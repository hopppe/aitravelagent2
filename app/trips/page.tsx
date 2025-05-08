'use client';

import React, { useState, useEffect } from 'react';
import TripList from '../../components/trips/TripList';
import SampleTrips from '../../components/trips/SampleTrips';
import { useAuth } from '../../hooks/useAuth';
import { supabaseAuth } from '../../lib/auth';

export default function TripsPage() {
  const { user } = useAuth();
  const [hasDeduplicatedTrips, setHasDeduplicatedTrips] = useState(false);

  // Run deduplication when the page loads if the user is authenticated
  useEffect(() => {
    const deduplicateTrips = async () => {
      if (!user || hasDeduplicatedTrips) return;

      try {
        // Get auth token
        const { data: sessionData } = await supabaseAuth.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        
        if (!accessToken) {
          console.log('No auth token available, skipping deduplication');
          return;
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        };

        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          // Call the deduplicate API
          const response = await fetch('/api/trips/deduplicate', {
            method: 'POST',
            headers,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error('Deduplication API error:', response.status);
            // Still set the flag to avoid repeated failed calls
            setHasDeduplicatedTrips(true);
            return;
          }

          const result = await response.json();
          console.log('Deduplication result:', result);
        } catch (fetchError) {
          console.error('Fetch error in deduplication:', fetchError);
          // Still set the flag to avoid repeated failed calls
          setHasDeduplicatedTrips(true);
        }
        
        // Set flag to prevent repeated calls
        setHasDeduplicatedTrips(true);
      } catch (error) {
        console.error('Error running trip deduplication:', error);
        // Still set the flag to avoid repeated failed calls
        setHasDeduplicatedTrips(true);
      }
    };

    deduplicateTrips();
  }, [user, hasDeduplicatedTrips]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Your Trips</h1>
      
      {user ? (
        <TripList />
      ) : (
        <>
          <div className="bg-primary/10 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-2">Sign in to save your trips</h2>
            <p className="text-gray-600 mb-4">Create an account to save and manage your travel itineraries.</p>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Sample Trips</h2>
          <p className="text-gray-600 mb-6">
            Explore these sample itineraries to see what our AI travel planner can create for you.
          </p>
          <SampleTrips />
        </>
      )}
    </div>
  );
} 