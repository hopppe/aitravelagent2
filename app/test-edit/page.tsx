'use client';

import React, { useState, useEffect } from 'react';
import { supabaseAuth } from '../../lib/auth';

export default function TestEditPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [editResponse, setEditResponse] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [testItem, setTestItem] = useState<any>(null);

  // Load available trips
  useEffect(() => {
    async function loadTrips() {
      try {
        setLoading(true);
        const { data: sessionData } = await supabaseAuth.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        const response = await fetch('/api/trips', { headers });
        
        if (!response.ok) {
          throw new Error('Failed to load trips');
        }
        
        const data = await response.json();
        if (data.trips && Array.isArray(data.trips)) {
          setTrips(data.trips);
          if (data.trips.length > 0) {
            setSelectedTripId(data.trips[0].id);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load trips');
      } finally {
        setLoading(false);
      }
    }
    
    loadTrips();
  }, []);

  // Select a trip for testing
  const handleSelectTrip = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTripId(e.target.value);
    setTestItem(null);
    setEditResponse(null);
  };

  // Load trip details to get first item
  const loadTripDetails = async () => {
    if (!selectedTripId) return;
    
    try {
      setLoading(true);
      setError(null);
      const { data: sessionData } = await supabaseAuth.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(`/api/trips/${selectedTripId}`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to load trip details');
      }
      
      const data = await response.json();
      if (!data.trip || !data.trip.trip_data) {
        throw new Error('Trip data not found or invalid');
      }
      
      // Parse trip data safely
      let tripData;
      try {
        tripData = typeof data.trip.trip_data === 'string' 
          ? JSON.parse(data.trip.trip_data) 
          : data.trip.trip_data;
        
        console.log('Loaded trip data:', {
          title: tripData.title || tripData.tripName,
          dayCount: tripData.days?.length,
          itemCounts: tripData.days?.map((day: any, i: number) => ({
            dayIndex: i,
            activities: day.activities?.length || 0,
            meals: day.meals?.length || 0,
            hasAccommodation: !!day.accommodation
          }))
        });
      } catch (parseError) {
        console.error('Error parsing trip data:', parseError);
        throw new Error('Failed to parse trip data');
      }
        
      // Get the first activity from the first day for testing
      if (!tripData.days || !Array.isArray(tripData.days) || tripData.days.length === 0) {
        throw new Error('Trip has no days');
      }
      
      const day = tripData.days[0];
      let testItem;
      
      if (day.activities && day.activities.length > 0) {
        const item = day.activities[0];
        testItem = {
          item,
          type: 'activity',
          dayIndex: 0
        };
        console.log('Selected activity for testing:', {
          id: item.id,
          title: item.title,
          description: item.description?.substr(0, 50) + '...'
        });
      } else if (day.meals && day.meals.length > 0) {
        const item = day.meals[0];
        testItem = {
          item,
          type: 'meal',
          dayIndex: 0
        };
        console.log('Selected meal for testing:', {
          id: item.id,
          venue: item.venue,
          description: item.description?.substr(0, 50) + '...'
        });
      } else if (day.accommodation) {
        const item = day.accommodation;
        testItem = {
          item,
          type: 'accommodation',
          dayIndex: 0
        };
        console.log('Selected accommodation for testing:', {
          id: item.id,
          name: item.name,
          description: item.description?.substr(0, 50) + '...'
        });
      }
      
      if (testItem) {
        setTestItem(testItem);
      } else {
        throw new Error('No items found in the first day of this trip');
      }
    } catch (err: any) {
      console.error('Error loading trip details:', err);
      setError(err.message || 'Failed to load trip details');
      setTestItem(null);
    } finally {
      setLoading(false);
    }
  };

  // Test the edit functionality
  const testEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTripId || !testItem) {
      setError('No trip or item selected');
      return;
    }
    
    try {
      setIsEditing(true);
      setError(null);
      
      // Get fresh trip data to ensure we have the latest version
      const { data: sessionData } = await supabaseAuth.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const tripResponse = await fetch(`/api/trips/${selectedTripId}`, { headers });
      
      if (!tripResponse.ok) {
        throw new Error('Failed to get latest trip data');
      }
      
      const tripData = await tripResponse.json();
      let parsedTripData;
      
      try {
        parsedTripData = typeof tripData.trip.trip_data === 'string'
          ? JSON.parse(tripData.trip.trip_data)
          : tripData.trip.trip_data;
      } catch (parseError) {
        console.error('Error parsing trip data for edit:', parseError);
        throw new Error('Failed to parse trip data for edit');
      }
      
      console.log('Submitting edit request with: ', {
        tripId: selectedTripId,
        itemId: testItem.item.id,
        itemType: testItem.type,
        dayIndex: testItem.dayIndex
      });
      
      // Use the mock-edit-item API instead of the real one
      const response = await fetch('/api/mock-edit-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: selectedTripId,
          itemId: testItem.item.id,
          itemType: testItem.type,
          dayIndex: testItem.dayIndex,
          userFeedback: feedback,
          existingDays: parsedTripData.days || []
        }),
      });
      
      const responseData = await response.json();
      setEditResponse(responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || `Error: ${response.status}`);
      }
      
      if (responseData.success) {
        console.log('Successfully edited item:', responseData.editedItem);
      }
      
    } catch (err: any) {
      console.error('Error editing item:', err);
      setError(err.message || 'Failed to edit item');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Edit Functionality</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Select a Trip:</label>
        <select 
          className="border border-gray-300 rounded p-2 w-full"
          value={selectedTripId || ''}
          onChange={handleSelectTrip}
          disabled={loading}
        >
          <option value="">Select a trip</option>
          {trips.map(trip => (
            <option key={trip.id} value={trip.id}>
              {trip.id} - {JSON.parse(trip.trip_data)?.title || 'Untitled Trip'}
            </option>
          ))}
        </select>
      </div>
      
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded mb-6"
        onClick={loadTripDetails}
        disabled={!selectedTripId || loading}
      >
        Load First Item
      </button>
      
      {testItem && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Test Item</h2>
          <p><strong>Type:</strong> {testItem.type}</p>
          <p><strong>ID:</strong> {testItem.item.id}</p>
          <p><strong>Title/Name:</strong> {testItem.item.title || testItem.item.name || testItem.item.venue}</p>
          <p><strong>Description:</strong> {testItem.item.description}</p>
          
          <form onSubmit={testEditItem} className="mt-4">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Edit Feedback:</label>
              <textarea
                className="border border-gray-300 rounded p-2 w-full h-24"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback for the AI to create an alternative..."
              />
            </div>
            
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-4 rounded"
              disabled={isEditing}
            >
              {isEditing ? 'Processing...' : 'Test Edit'}
            </button>
          </form>
        </div>
      )}
      
      {editResponse && (
        <div className="mt-6 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Edit Response</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(editResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 