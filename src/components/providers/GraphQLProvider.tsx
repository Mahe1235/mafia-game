'use client';

/**
 * Apollo Client provider for the application
 * With safeguards for server-side rendering and error handling
 */
import { useState, useEffect } from 'react';
import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Error boundary component
function ErrorFallback({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

interface GraphQLProviderProps {
  children: React.ReactNode;
}

export function GraphQLProvider({ children }: GraphQLProviderProps) {
  // Track client initialization status
  const [client, setClient] = useState<ApolloClient<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize client on mount
  useEffect(() => {
    try {
      // Only create client on the client-side
      const httpLink = createHttpLink({
        uri: '/api/graphql',
        credentials: 'same-origin'
      });
      
      const apolloClient = new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: {
            fetchPolicy: 'network-only'
          }
        }
      });
      
      setClient(apolloClient);
    } catch (err) {
      console.error('Failed to initialize Apollo client:', err);
      setError(err as Error);
    }
  }, []);
  
  // If there's an error or no client yet, render children without provider
  if (error || !client) {
    return <ErrorFallback>{children}</ErrorFallback>;
  }
  
  // Once client is initialized, use the Apollo provider
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
} 