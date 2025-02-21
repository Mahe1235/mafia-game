export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-[95%] sm:max-w-md">
        <div className="space-y-4 sm:space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
} 