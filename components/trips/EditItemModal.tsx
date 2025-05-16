import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit } from 'react-icons/fa';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void>;
  itemTitle: string;
  itemType: string;
  isSubmitting: boolean;
  error: string | null;
}

export default function EditItemModal({
  isOpen,
  onClose,
  onSubmit,
  itemTitle,
  itemType,
  isSubmitting,
  error
}: EditItemModalProps) {
  const [feedback, setFeedback] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Reset validation error when feedback changes
  useEffect(() => {
    if (validationError) {
      setValidationError(null);
    }
  }, [feedback, validationError]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // No validation requirements, accept any input or empty string
    setValidationError(null);
    
    try {
      console.log(`Submitting edit for ${itemType} "${itemTitle}" with feedback:`, 
        feedback || '(empty feedback)');
      await onSubmit(feedback);
    } catch (err) {
      console.error('Error in form submission:', err);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200 ease-in-out">
      <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scaleIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit {itemType}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 rounded-full h-8 w-8 flex items-center justify-center"
            aria-label="Close"
            type="button"
          >
            <FaTimes size={16} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          {itemTitle ? (
            <>Edit or replace <span className="font-medium">"{itemTitle}"</span></>
          ) : (
            <>Edit this {itemType}</>
          )}
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4">
            {error}
          </div>
        )}
        
        {validationError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 mb-4">
            {validationError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="feedback" className="block text-gray-700 text-sm font-medium mb-2">
              Optional Feedback:
            </label>
            <textarea
              id="feedback"
              className="w-full border border-gray-300 rounded p-2 h-32 focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Example: I'd prefer something with less walking, something more child-friendly, or a different cuisine type..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              aria-label="Feedback for alternative item"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to get a random alternative suggestion
            </p>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  Processing...
                </>
              ) : (
                <>
                  <FaEdit className="mr-2" /> Find Alternative
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 