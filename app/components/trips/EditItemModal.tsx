import React, { useState, useEffect } from 'react';
// Import XIcon directly from a node_modules path that works
import { XIcon } from '@heroicons/react/solid';

// Define BaseItem type based on the existing type in the project
type BaseItem = {
  id?: string;
  title?: string;
  description: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  cost: number | string;
  name?: string; // For accommodations
};

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  item: BaseItem | null;
  itemType: 'activity' | 'meal' | 'accommodation';
  error?: string;
}

const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
  itemType,
  error
}) => {
  const [feedback, setFeedback] = useState('');

  // Reset feedback when the modal opens with a new item
  useEffect(() => {
    if (isOpen) {
      setFeedback('');
    }
  }, [isOpen, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(feedback);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Edit {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {item && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">
              {itemType === 'accommodation' ? item.name : item.title}
            </h3>
            <p className="text-gray-600 mb-4">{item.description}</p>
            
            {itemType === 'accommodation' && (
              <p className="text-xs text-amber-600 mb-2">
                Note: Changes to accommodations will update all days using the same accommodation.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
              How would you like to improve this {itemType}? (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Even without specific feedback, our AI will enhance this item. But your guidance helps make it more personalized!
            </p>
            <textarea
              id="feedback"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Examples: 'Make it more adventurous', 'Include local specialties', 'Find a place with better views', etc."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal; 