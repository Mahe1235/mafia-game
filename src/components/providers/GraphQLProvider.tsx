'use client';

/**
 * Apollo Client provider for the application
 * With safeguards for server-side rendering
 */
import { ApolloProvider } from '@apollo/client';
import { client } from '@/lib/graphql';

interface GraphQLProviderProps {
  children: React.ReactNode;
}

export function GraphQLProvider({ children }: GraphQLProviderProps) {
  // Check if we're in a static generation or server rendering environment
  const isServerRendering = typeof window === 'undefined';
  
  // During static generation or server rendering, just return children
  // to avoid useContext React hooks errors
  if (isServerRendering) {
    return <>{children}</>;
  }
  
  // In client-side rendering, use the Apollo provider
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
} 