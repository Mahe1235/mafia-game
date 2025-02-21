'use client';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Mafia Game</h1>
      
      <div className="flex flex-col gap-4">
        <button 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => console.log('Create game clicked')}
        >
          Create Game
        </button>
        
        <button 
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          onClick={() => console.log('Join game clicked')}
        >
          Join Game
        </button>
      </div>
    </div>
  );
}