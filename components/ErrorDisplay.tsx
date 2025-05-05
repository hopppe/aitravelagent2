'use client';

import React from 'react';

interface ErrorAction {
  text: string;
  fn: () => void;
  isPrimary?: boolean;
}

interface ErrorDisplayProps {
  title?: string;
  message: string;
  details?: string;
  suggestion?: string;
  actions?: ErrorAction[];
  troubleshootingTips?: string[];
  className?: string;
  showTroubleshootingTips?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'An error occurred',
  message,
  details,
  suggestion = 'Please try again',
  actions = [],
  troubleshootingTips,
  className = '',
  showTroubleshootingTips = true,
}) => {
  // If no custom tips are provided, use default tips
  const tips = troubleshootingTips || [
    'Check that your Supabase credentials are correct in your .env.local file',
    'Verify that the OpenAI API key is valid',
    'Make sure you\'ve created the necessary tables in your database',
    'Try clearing your browser cache and refreshing',
  ];

  return (
    <div className={`p-6 max-w-lg mx-auto my-4 bg-white rounded-lg shadow-md border border-red-100 ${className}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <svg 
            className="w-12 h-12 text-red-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        
        {details && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm text-gray-700 text-left overflow-auto max-h-32">
            <p className="font-mono whitespace-pre-wrap">{details}</p>
          </div>
        )}
        
        <p className="text-gray-600 mb-6">{suggestion}</p>
        
        {actions.length > 0 && (
          <div className="flex justify-center space-x-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.fn}
                className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  action.isPrimary 
                    ? 'bg-primary text-white hover:bg-opacity-90' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {action.text}
              </button>
            ))}
          </div>
        )}

        {showTroubleshootingTips && tips.length > 0 && (
          <div className="mt-6 text-xs text-gray-500">
            <p className="mb-1 font-medium">Troubleshooting Tips:</p>
            <ul className="list-disc text-left pl-6">
              {tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay; 