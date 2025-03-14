/**
 * GraphQL client configuration and utilities
 */
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: '/api/graphql',
  credentials: 'same-origin'
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only'
    }
  }
});

/**
 * Common GraphQL queries and mutations
 */
export const queries = {
  GET_ROOM: `
    query GetRoom($code: String!) {
      getRoom(code: $code) {
        code
        hostName
        players {
          id
          name
          role
          isAlive
        }
        status
        minPlayers
        maxPlayers
        roles {
          mafia
          detective
          doctor
          civilian
        }
      }
    }
  `,

  VALIDATE_SESSION: `
    query ValidateSession($code: String!, $playerId: String) {
      validateSession(code: $code, playerId: $playerId)
    }
  `
};

export const mutations = {
  CREATE_ROOM: `
    mutation CreateRoom($hostName: String!) {
      createRoom(hostName: $hostName) {
        code
        hostName
        players {
          id
          name
        }
        status
      }
    }
  `,

  JOIN_ROOM: `
    mutation JoinRoom($code: String!, $playerName: String!) {
      joinRoom(code: $code, playerName: $playerName) {
        id
        name
        role
        isAlive
      }
    }
  `,

  START_GAME: `
    mutation StartGame($code: String!) {
      startGame(code: $code)
    }
  `,

  END_GAME: `
    mutation EndGame($code: String!, $reason: String!) {
      endGame(code: $code, reason: $reason)
    }
  `
}; 