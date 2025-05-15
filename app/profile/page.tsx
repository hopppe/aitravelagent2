'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { FaUser, FaEnvelope, FaPlane, FaSignOutAlt } from 'react-icons/fa';
import TripList from '../../components/trips/TripList';

export default function ProfilePage() {
  const { user, loading, refreshUser, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Load user data
  useEffect(() => {
    if (user?.user_metadata?.name) {
      setName(user.user_metadata.name);
    }
  }, [user]);

  // Validate name (simple validation to match backend requirements)
  const validateName = (name: string): boolean => {
    return typeof name === 'string' && name.length <= 255;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Client-side validation
      if (name && !validateName(name)) {
        throw new Error('Name must be a string with maximum 255 characters');
      }

      // Call the API to update the user profile
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          name: name.trim() || null, // Trim whitespace and use null if empty
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Refresh the user data to update the name in the navbar and elsewhere
      await refreshUser();
      
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user (should redirect, but this is a fallback)
  if (!user) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="mb-4">You need to be signed in to view your profile.</p>
        <Link href="/auth" className="bg-primary text-white px-4 py-2 rounded">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors"
        >
          <FaSignOutAlt />
          <span>Sign Out</span>
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-primary text-white p-4">
            <h2 className="text-xl font-semibold">Account Information</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <FaEnvelope className="text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <FaUser className="text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="font-medium">
                  {user.app_metadata?.provider || 'Email'} account
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-primary text-white p-4">
            <h2 className="text-xl font-semibold">Profile Information</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 mb-2">
                Display Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your name"
                maxLength={255}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum 255 characters
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="bg-primary text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <FaPlane className="mr-2" /> Your Trips
          </h2>
          <Link
            href="/trips/new"
            className="bg-white text-primary px-4 py-1 rounded-md text-sm font-medium hover:bg-gray-100"
          >
            Create New Trip
          </Link>
        </div>
        
        <div className="p-6">
          <TripList redirectIfUnauthenticated={false} />
        </div>
      </div>
    </div>
  );
} 