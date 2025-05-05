import React from 'react';
import Link from 'next/link';
import { FaPlane, FaMapMarkedAlt, FaWallet, FaCalendarAlt, FaMobileAlt, FaSuitcase, FaCompass } from 'react-icons/fa';
import TripList from '../components/trips/TripList';
import SampleTrips from '../components/trips/SampleTrips';
import AuthAwareLink from '../components/auth/AuthAwareLink';

export default function Home() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
          Your AI Travel Companion
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create personalized travel itineraries powered by artificial intelligence. 
          Plan your perfect trip with smart recommendations and detailed daily schedules.
        </p>
        <div className="mt-8">
          <Link href="/trips/new" className="bg-primary text-white py-3 px-8 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-all">
            Plan My Trip
          </Link>
        </div>
      </section>

      {isDevelopment && (
        <section className="bg-blue-50 p-6 rounded-lg shadow-sm mb-12 max-w-2xl mx-auto">
          <div className="flex items-start">
            <FaMobileAlt className="text-blue-500 text-2xl mt-1 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Access on Mobile Devices (Development Mode)</h3>
              <p className="text-gray-700 mt-2">
                Want to test the app on your phone? Run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev:mobile</code> and 
                access the app on your phone using your computer's local IP address:
              </p>
              <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto">
                http://192.168.8.27:3000
              </pre>
              <p className="text-gray-600 mt-2 text-sm">
                Make sure your phone is connected to the same WiFi network as your computer.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <FeatureCard 
          icon={<FaPlane />}
          title="Personalized Itineraries"
          description="AI-generated travel plans tailored to your preferences, budget, and travel style."
        />
        <FeatureCard 
          icon={<FaMapMarkedAlt />}
          title="Interactive Maps"
          description="Visualize your daily activities with our interactive maps feature."
        />
        <FeatureCard 
          icon={<FaWallet />}
          title="Budget Forecasting"
          description="Get accurate cost estimates for accommodation, food, activities, and transportation."
        />
        <FeatureCard 
          icon={<FaCalendarAlt />}
          title="Day-by-Day Planning"
          description="Detailed daily schedules with activities, restaurants, and travel times."
        />
      </section>

      <section className="bg-gray-50 p-8 rounded-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <StepCard 
            number={1}
            title="Fill Out the Survey"
            description="Tell us about your destination, dates, preferences, and budget."
          />
          <StepCard 
            number={2}
            title="Generate Your Itinerary"
            description="Our AI creates a custom travel plan based on your preferences."
          />
          <StepCard 
            number={3}
            title="Explore and Customize"
            description="View your itinerary, make adjustments, and save for your trip."
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaSuitcase />
            <span>Your Trips</span>
          </h2>
          <AuthAwareLink 
            href="/trips"
            fallbackHref="/auth"
            className="text-primary hover:text-accent transition-colors"
            label="View All"
          />
        </div>
        
        <TripList redirectIfUnauthenticated={false} />
      </section>
      
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaCompass />
            <span>Sample Trips</span>
          </h2>
          <Link 
            href="/trips/new"
            className="text-primary hover:text-accent transition-colors"
          >
            Create Your Own
          </Link>
        </div>
        
        <SampleTrips />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="text-primary text-3xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
} 