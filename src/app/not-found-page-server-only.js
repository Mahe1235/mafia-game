/**
 * Flag file to indicate server-only entry point in Next.js.
 * This ensures the not-found.tsx page doesn't try to use client components or hooks.
 */
export default {};

export const runtime = 'nodejs';
export const preferredRegion = 'global'; 