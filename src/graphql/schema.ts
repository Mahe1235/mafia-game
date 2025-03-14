/**
 * GraphQL schema definitions
 */
export const typeDefs = `#graphql
  type Player {
    id: ID!
    name: String!
    role: String
    isAlive: Boolean
  }

  type GameRoom {
    code: String!
    hostName: String!
    players: [Player!]!
    status: String!
    minPlayers: Int!
    maxPlayers: Int!
    roles: RoleDistribution
    gameState: GameState
  }

  type RoleDistribution {
    mafia: Int!
    detective: Int!
    doctor: Int!
    civilian: Int!
  }

  type Query {
    getRoom(code: String!): GameRoom
    validateSession(code: String!, playerId: String): Boolean!
  }

  type Mutation {
    createRoom(hostName: String!): GameRoom!
    joinRoom(code: String!, playerName: String!): Player
    startGame(code: String!): Boolean!
    endGame(code: String!, reason: String!): Boolean!
    updateRoomStatus(code: String!, status: String!): GameRoom
    shuffleRoles(code: String!): Boolean!
    performAction(
      code: String!, 
      playerId: String!, 
      action: GameAction!, 
      targetId: String!
    ): Boolean!
    advancePhase(
      code: String!
    ): GameState!
  }

  type Subscription {
    roomUpdated(code: String!): GameRoom!
    playerJoined(code: String!): Player!
    playerLeft(code: String!, playerId: String!): String!
    gameStarted(code: String!): [Player!]!
    gameEnded(code: String!): String!
    gameStateUpdated(code: String!): GameState!
    playerActionPerformed(code: String!): GameAction!
  }

  enum GamePhase {
    day
    night
    voting
  }

  enum GameAction {
    vote
    investigate
    protect
    kill
  }

  type GameState {
    phase: GamePhase!
    round: Int!
    timeLeft: Int!
    votes: [Vote!]
    lastKilled: String
    lastSaved: String
    lastInvestigated: String
  }

  type Vote {
    playerId: String!
    targetId: String!
  }
`; 