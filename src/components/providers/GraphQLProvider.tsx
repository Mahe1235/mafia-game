/**
 * Apollo Client provider for the application
 */
import { ApolloProvider } from '@apollo/client';
import { client } from '@/lib/graphql';

interface GraphQLProviderProps {
  children: React.ReactNode;
}

export function GraphQLProvider({ children }: GraphQLProviderProps) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
} 