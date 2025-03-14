/**
 * Loading component for Next.js page transitions
 * This component is rendered when pages are loading
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] text-center p-6">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Loading...
        </span>
      </div>
      <p className="ml-4 text-lg text-gray-700">Loading...</p>
    </div>
  );
} 