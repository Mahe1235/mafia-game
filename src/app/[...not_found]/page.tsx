import { notFound } from 'next/navigation';

/**
 * Catch-all route that triggers the Next.js not-found boundary
 */
export default function CatchAllNotFound() {
  notFound();
} 