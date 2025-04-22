'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { 
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  getCurrentUser,
  getSession,
} from '../lib/auth';

// Define the shape of our auth context
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ 
    error: any | null; 
    success: boolean;
    user?: User | null;
  }>;
  signUp: (email: string, password: string) => Promise<{ 
    error: any | null; 
    success: boolean;
    user?: User | null;
  }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps the app and makes auth available
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to get the current user
  const refreshUser = async (): Promise<User | null> => {
    try {
      const { session } = await getSession();
      if (session) {
        const { user } = await getCurrentUser();
        setUser(user);
        return user;
      }
      setUser(null);
      return null;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  };

  // Check for an active session on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);

  // Sign in handler
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await authSignIn(email, password);
      
      if (error) {
        return { error, success: false, user: null };
      }
      
      if (data?.user) {
        setUser(data.user);
        return { error: null, success: true, user: data.user };
      }
      
      return { error: new Error('No user returned from sign in'), success: false, user: null };
    } catch (error) {
      return { error, success: false, user: null };
    }
  };

  // Sign up handler
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await authSignUp(email, password);
      
      if (error) {
        return { error, success: false, user: null };
      }
      
      if (data?.user) {
        setUser(data.user);
        return { error: null, success: true, user: data.user };
      }
      
      return { 
        error: null, 
        success: true,
        user: null
      };
    } catch (error) {
      return { error, success: false, user: null };
    }
  };

  // Sign out handler
  const signOut = async () => {
    await authSignOut();
    setUser(null);
  };

  // The value to provide to consumers
  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 