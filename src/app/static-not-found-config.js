// This file configures the not-found page behavior
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// Completely disable static generation for this route
export const generateStaticParams = () => {
  return [];
}; 