import type { Player } from '@/types/game';

export const PlayerStore = {
  getPlayers: (roomCode: string): Player[] => {
    const players = localStorage.getItem(`room_${roomCode}`);
    return players ? JSON.parse(players) : [];
  },

  addPlayer: (roomCode: string, player: Player) => {
    const players = PlayerStore.getPlayers(roomCode);
    if (!players.find(p => p.name === player.name)) {
      players.push(player);
      localStorage.setItem(`room_${roomCode}`, JSON.stringify(players));
    }
  },

  updatePlayers: (roomCode: string, players: Player[]) => {
    localStorage.setItem(`room_${roomCode}`, JSON.stringify(players));
  }
}; 