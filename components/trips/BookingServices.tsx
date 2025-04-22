'use client';

import React from 'react';
import { FaPlane, FaBed, FaExternalLinkAlt } from 'react-icons/fa';

interface BookingServiceLink {
  id: string;
  name: string;
  type: 'flight' | 'hotel';
  url: string;
  description: string;
  icon: React.ReactNode;
}

interface BookingServicesProps {
  destination: string;  // Destination name for searches
  startDate: string;    // ISO date string
  endDate: string;      // ISO date string
}

export default function BookingServices({ destination, startDate, endDate }: BookingServicesProps) {
  // Generate URLs for booking services
  const accommodationLinks: BookingServiceLink[] = [
    {
      id: 'booking',
      name: 'Booking.com',
      type: 'hotel',
      description: 'Find hotels, apartments and more',
      url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}&checkin=${startDate}&checkout=${endDate}`,
      icon: <FaBed />
    },
    {
      id: 'airbnb',
      name: 'Airbnb',
      type: 'hotel',
      description: 'Unique homes and experiences',
      url: `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes?checkin=${startDate}&checkout=${endDate}`,
      icon: <FaBed />
    }
  ];
  
  const flightLinks: BookingServiceLink[] = [
    {
      id: 'skyscanner',
      name: 'Skyscanner',
      type: 'flight',
      description: 'Compare flights across airlines',
      url: `https://www.skyscanner.com/transport/flights/nyc/${destination.substring(0, 3)}/${startDate}/${endDate}/`,
      icon: <FaPlane />
    },
    {
      id: 'kiwi',
      name: 'Kiwi.com',
      type: 'flight',
      description: 'Find the best flight deals',
      url: `https://www.kiwi.com/us/search/results/anywhere-${destination.substring(0, 3)}/${startDate}/${endDate}`,
      icon: <FaPlane />
    }
  ];
  
  // Helper function to render booking service links
  const renderServiceLinks = (services: BookingServiceLink[]) => {
    return services.map(service => (
      <a 
        key={service.id}
        href={service.url}
        target="_blank"
        rel="noopener noreferrer"
        className="border p-4 rounded-lg hover:shadow-md transition-shadow flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="text-primary text-xl">
            {service.icon}
          </div>
          <div>
            <p className="font-medium">{service.name}</p>
            <p className="text-xs text-gray-500">{service.description}</p>
          </div>
        </div>
        <FaExternalLinkAlt className="text-gray-400" />
      </a>
    ));
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Book Your Trip</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accommodation Section */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaBed className="text-primary" /> Book Your Accommodation
          </h3>
          <div className="space-y-4">
            {renderServiceLinks(accommodationLinks)}
          </div>
        </div>
        
        {/* Flights Section */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaPlane className="text-primary" /> Book Your Flights
          </h3>
          <div className="space-y-4">
            {renderServiceLinks(flightLinks)}
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <p className="text-xs text-gray-500 mt-6">
        Note: We are not affiliated with any of these booking services. Links open in a new tab with prefilled search criteria.
      </p>
    </div>
  );
} 