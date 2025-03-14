/**
 * Custom 404 page that's fully compatible with server rendering
 * This does not use any client-side React features
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-16 bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700 mb-8">Page Not Found</h2>
        <p className="text-lg text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Return Home
        </a>
      </div>
    </div>
  );
} 