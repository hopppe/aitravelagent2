'use client';

import Link from 'next/link';
import { FaPlane, FaUser } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const { user, loading } = useAuth();
  
  // Get user's display name if available
  const displayName = user?.user_metadata?.name || '';

  // Render the auth section based on loading/auth state
  const renderAuthSection = () => {
    if (loading) {
      // Return a placeholder with same width while loading to prevent layout shift
      return <div className="w-20 h-6"></div>;
    }
    
    if (user) {
      return (
        <div className="flex items-center gap-3">
          <Link 
            href="/profile" 
            className="flex items-center gap-1 hover:text-accent transition-colors"
          >
            <FaUser />
            <span>{displayName ? displayName : 'Profile'}</span>
          </Link>
        </div>
      );
    }
    
    return (
      <Link 
        href="/auth" 
        className="flex items-center gap-1 hover:text-accent transition-colors"
      >
        <FaUser />
        <span>Sign In</span>
      </Link>
    );
  };

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <FaPlane className="text-2xl" />
          <span>AI Travel Agent</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <Link href="/trips" className="hover:text-accent transition-colors">
            My Trips
          </Link>
          <Link href="/about" className="hover:text-accent transition-colors">
            About
          </Link>
          
          {renderAuthSection()}
        </div>
      </div>
    </nav>
  );
} 