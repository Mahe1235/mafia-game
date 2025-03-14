'use client';

import { useEffect } from 'react';

/**
 * Global error component for handling application-wide errors
 * This component is rendered when an error occurs in the root layout
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-lg text-gray-700 mb-6">
            We've encountered a critical error. Please try again or contact support.
          </p>
          <div className="space-x-4">
            <button 
              onClick={reset} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 