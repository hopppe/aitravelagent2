'use client';

import { FaSuitcase } from 'react-icons/fa';
import TripList from '../../components/trips/TripList';

export default function TripsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FaSuitcase />
          <span>Your Trips</span>
        </h1>
      </div>
      
      <TripList redirectIfUnauthenticated={true} />
    </div>
  );
} 