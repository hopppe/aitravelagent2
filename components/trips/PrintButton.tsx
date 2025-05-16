import React from 'react';
import { FaFilePdf } from 'react-icons/fa';

interface PrintButtonProps {
  tripId: string;
}

export default function PrintButton({ tripId }: PrintButtonProps) {
  const handlePrint = () => {
    // Add a trip ID to the body (we can use this in the print stylesheet if needed)
    document.body.setAttribute('data-printing-trip', tripId);
    
    // Trigger browser print dialog
    window.print();
    
    // Clean up after printing is done/cancelled
    setTimeout(() => {
      document.body.removeAttribute('data-printing-trip');
    }, 1000);
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 group rounded-md hover:bg-accent hover:text-white"
    >
      <FaFilePdf className="mr-2" />
      Print PDF
    </button>
  );
} 