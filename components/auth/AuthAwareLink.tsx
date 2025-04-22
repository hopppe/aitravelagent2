'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

interface AuthAwareLinkProps {
  href: string;
  fallbackHref: string;
  className?: string;
  label: string;
}

export default function AuthAwareLink({ 
  href, 
  fallbackHref, 
  className, 
  label 
}: AuthAwareLinkProps) {
  const { user } = useAuth();
  
  // Determine the target URL based on authentication status
  const targetHref = user ? href : fallbackHref;
  
  return (
    <Link href={targetHref} className={className}>
      {label}
    </Link>
  );
} 