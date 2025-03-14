'use client';

/**
 * Apollo Client provider for the application
 * With safeguards for server-side rendering
 */
import { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from '@/lib/graphql';

interface GraphQLProviderProps {
  children: React.ReactNode;
}

export function GraphQLProvider({ children }: GraphQLProviderProps) {
  // Track if we're mounted in the client
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // If we haven't mounted yet, render children without the provider
  // This runs during SSR and the first client render
  if (!isMounted) {
    return <>{children}</>;
  }
  
  // Once we're mounted in the client, use the Apollo provider
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
} 