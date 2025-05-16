import React, { useState } from 'react';
import { FaShare, FaLink } from 'react-icons/fa';
import { Menu } from '@headlessui/react';
import PrintButton from './PrintButton';

interface ShareMenuProps {
  tripId: string;
}

export default function ShareMenu({ tripId }: ShareMenuProps) {
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Get the current origin for creating absolute URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  const getShareableLink = () => {
    if (tripId === 'demo' || !tripId) {
      return null;
    }
    // Always use the production URL for sharing
    return `https://aitravelagent-blue.vercel.app/trips/generated-trip?id=${tripId}`;
  };

  const copyLinkToClipboard = () => {
    const link = getShareableLink();
    if (!link) {
      // Show warning for unsaved trips
      setShowUnsavedWarning(true);
      setTimeout(() => setShowUnsavedWarning(false), 3000);
      return;
    }
    
    navigator.clipboard.writeText(link)
      .then(() => {
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };

  return (
    <div className="relative">
      <Menu>
        <Menu.Button className="bg-accent text-white py-2 px-4 rounded-md hover:bg-opacity-90 flex items-center gap-1">
          <FaShare /> <span>Share</span>
        </Menu.Button>
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={copyLinkToClipboard}
                  className={`${
                    active ? 'bg-accent text-white' : 'text-gray-700'
                  } group flex rounded-md items-center w-full px-3 py-2 text-sm`}
                >
                  <FaLink className="mr-2" />
                  Copy shareable link
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <div className={active ? 'bg-accent text-white' : 'text-gray-700'}>
                  <PrintButton tripId={tripId} />
                </div>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Menu>
      
      {showCopiedMessage && (
        <div className="absolute right-0 mt-2 bg-green-100 text-green-800 text-sm py-1 px-2 rounded-md shadow-sm">
          Link copied!
        </div>
      )}
      
      {showUnsavedWarning && (
        <div className="absolute right-0 mt-2 bg-amber-100 text-amber-800 text-sm py-1 px-2 rounded-md shadow-sm max-w-xs">
          Please save your trip first to share it.
        </div>
      )}
    </div>
  );
} 