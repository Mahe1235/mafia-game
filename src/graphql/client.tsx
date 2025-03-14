/**
 * GraphQL Client Provider for Apollo Client
 */
"use client";

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from '@/lib/graphql';

interface GraphQLClientProviderProps {
  children: React.ReactNode;
}

export function GraphQLClientProvider({ children }: GraphQLClientProviderProps) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
} 