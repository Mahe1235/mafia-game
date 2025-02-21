import { pusher } from '@/lib/pusher';
import type { GameRoom, Player, PlayerRole, PlayerSession } from '@/types/game';

class GameService {
  private rooms: Map<string, GameRoom> = new Map();

  // Room Management
  async createRoom(hostName: string): Promise<GameRoom> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: GameRoom = {
      code,
      hostName,
      players: [],
      status: 'waiting',
      minPlayers: 6,
      maxPlayers: 15
    };

    this.rooms.set(code, room);
    return room;
  }

  async getRoom(code: string): Promise<GameRoom | null> {
    return this.rooms.get(code) || null;
  }

  async joinRoom(code: string, playerName: string): Promise<Player | null> {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'waiting') return null;

    const newPlayer: Player = {
      id: Math.random().toString(36).substring(2, 15),
      name: playerName,
      role: 'unassigned',
      isAlive: true
    };

    room.players.push(newPlayer);
    await this.notifyRoomUpdate(code, 'player-joined', newPlayer);
    return newPlayer;
  }

  async startGame(code: string): Promise<boolean> {
    const room = this.rooms.get(code);
    if (!room || room.players.length < 4) return false;

    room.status = 'started';
    this.assignRoles(room);
    await this.notifyRoomUpdate(code, 'game-started', room.players);
    return true;
  }

  async endGame(code: string, reason: string): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) return;

    room.status = 'ended';
    await this.notifyRoomUpdate(code, 'game-ended', { reason });
    this.rooms.delete(code);
  }

  // Role Management
  private assignRoles(room: GameRoom): void {
    const roles: PlayerRole[] = [];
    const { mafia, detective, doctor, civilian } = room.roles!;

    roles.push(...Array(mafia).fill('mafia'));
    roles.push(...Array(detective).fill('detective'));
    roles.push(...Array(doctor).fill('doctor'));
    roles.push(...Array(civilian).fill('civilian'));

    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Assign roles to players
    room.players.forEach((player, index) => {
      player.role = roles[index];
    });
  }

  // Notifications
  private async notifyRoomUpdate(code: string, event: string, data: unknown): Promise<void> {
    await pusher.trigger(`game-${code}`, event, data);
  }

  // Session Validation
  validateHostSession(code: string, session: string | null): boolean {
    const room = this.rooms.get(code);
    return room !== undefined && session === code;
  }

  validatePlayerSession(session: PlayerSession | null, code: string): boolean {
    if (!session) return false;
    const room = this.rooms.get(code);
    if (!room) return false;
    return room.players.some(p => p.id === session.id);
  }
}

export const gameService = new GameService(); 