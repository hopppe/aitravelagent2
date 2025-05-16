'use client';

import { useEffect } from 'react';

/**
 * Component that runs on app startup to clean up any stale trip saving locks
 * in localStorage to prevent issues with trip saving.
 */
export default function TripStorageCleanup() {
  useEffect(() => {
    // Clean up any stale localStorage flags for trip saving
    try {
      // Check if there's a lock and if it's stale
      const savingData = localStorage.getItem('isSavingTrip');
      if (savingData) {
        try {
          const parsed = JSON.parse(savingData);
          const now = Date.now();
          const timestamp = parsed.timestamp || 0;
          
          // If the save lock is older than 10 minutes, it's definitely stale
          if (now - timestamp > 600000) {
            console.log('Removing stale trip save lock from previous session');
            localStorage.removeItem('isSavingTrip');
          } else {
            console.log('Found recent save lock, keeping it in case a save is in progress');
          }
        } catch (e) {
          // If we can't parse it, it's invalid, so remove it
          console.log('Removing invalid trip save lock');
          localStorage.removeItem('isSavingTrip');
        }
      }
    } catch (error) {
      console.error('Error cleaning up localStorage:', error);
    }
  }, []);

  // This component doesn't render anything
  return null;
} 